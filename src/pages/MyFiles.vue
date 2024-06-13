<template>
  <div class="container">
    <ActionBar
      :selected-count="selectedItems.length"
      @remove="handleRemove"
      @rename="modal.rename = true"
      @files-choosen="choosenFiles = $event"
      @create-folder="modal.newFolder = true"
      @starred="addItemsToStarred"
    />

    <!-- sort-toggler thing is removed from here and moved into component -->

    <teleport to="#search-form">
      <SearchForm v-model="q" />
    </teleport>

    <DropZone @files-dropped="choosenFiles = $event" :show-message="!files.length && !folders.length">
      <SectionHeader title="Folders" @sort-change="handleSortChange" v-if="folders.length" sort-toggler /> <!-- :sort-toggler is equivalent to :sort-toggler="true" -->
      <div>
<!--        Folder Id: {{ $route.params.folderId }}-->
        Folder Id: {{ folderId }}
      </div>

      <!--
        The previous code here in  this FolderList was:
        <FoldersList
          @double-click="$router.push({ name: 'folders', params: { folderId: $event.id } })"
        >
      -->
      <FoldersList
        @double-click="handleDoubleClickFolder"
        :folders="folders"
        @select-change="handleSelectChange($event)"
        :selected="selectedItems"
      />
      <SectionHeader title="Files" @sort-change="handleSortChange" v-if="files.length" :sort-toggler="!folders.length" />
      <FilesList :files="files" @select-change="handleSelectChange($event)" :selected="selectedItems" />
    </DropZone>

    <app-toast :show="toast.show" :message="toast.message" type="success" position="bottom-left" @hide="toast.show = false" />
    <app-modal
      :title="modal.rename ? 'Rename' : 'New Folder'"
      :show="(modal.rename && selectedItems.length === 1) || modal.newFolder"
      @hide="modal.rename = false, modal.newFolder = false"
    >
      <FolderNewForm
        v-if="modal.newFolder"
        @folder-created="handleFolderCreated"
        @close="modal.newFolder = false"
        :folder-id="folderId"
      />
      <RenameForm
        :data="selectedItems[0]"
        @close="modal.rename = false"
        @updated="handleFileUpdated($event)"
        :submit="renameFile"
        v-else-if="modal.rename && isFile"
      />
      <RenameForm
        :data="selectedItems[0]"
        @close="modal.rename = false"
        @updated="handleFolderUpdated"
        :submit="renameFolder"
        v-else
      />
    </app-modal>
<!--    <div v-if="choosenFiles.length">Uploading</div>-->
    <UploaderPopup
      :files="choosenFiles"
      @upload-complete="handleUploadComplete"
      :folder-id="folderId"
    />
  </div>
</template>

<script>
import filesApi from "../api/files";
import foldersApi from "../api/folders";

import { addFileToStarred, addFolderToStarred } from "../api/starred";

import FilesList from "../components/files/FilesList.vue";
import FoldersList from "../components/files/FoldersList.vue";
// import SortToggler from "../components/files/SortToggler.vue";
import SectionHeader from "../components/files/SectionHeader.vue";

import ActionBar from "../components/ActionBar.vue";
import SearchForm from "../components/SearchForm.vue";
import RenameForm from '../components/files/RenameForm.vue';
import FolderNewForm from "../components/files/FolderNewForm.vue";

import DropZone from '../components/uploader/file-chooser/DropZone.vue'

import UploaderPopup from "../components/uploader/popup/UploaderPopup.vue";

import {onMounted, ref, reactive, watchEffect, toRef, provide, computed, onUpdated, watch} from "vue";

import { useRoute, useRouter } from 'vue-router';

const getPath = (folderId) => {
  let folderPath = 'folders';
  let filePath   = 'files';

  if ( folderId > 0 ) {
    const basePath = `folders/${folderId}`;
    folderPath     = `${basePath}/${folderPath}`;
    filePath       = `${basePath}/${filePath}`;
  }

  return { folderPath, filePath };
};

const fetchFoldersAndFiles = async (folderId, query) => {
  try {
    // const { folderPath, filePath } = getPath(query);
    const { folderPath, filePath } = getPath(folderId);

    const apiQuery = { ...query, folderId };

    // we renamed data to files ( alias ), because we're going to make API calls
    // to two endpoints: files and folders
    const { data: folders } = await foldersApi.index(apiQuery, folderPath);
    const { data: files }   = await filesApi.index(apiQuery, filePath);

    return { folders, files };
  } catch (error) {
    console.error(error);
  }
};

// /files?_sort=name&_order=asc

const removeItem = async (item, items, fn) => { // made 'items' in parameter declaration from 'files' because this function can  work for both file and folder deletion
  // we'll make API call to remove item in the server

  try {

    const response = await fn(item.id);

    if ( response.status === 200 || response.status === 204 ) {
      const index = items.value.findIndex(i => i.id === item.id); // changed i because it's item (could either be file or folder)
      items.value.splice(index, 1);
    }

  } catch (err) {
    console.error('Error: ' + err);
  }

};

const addToStarred = (items) => {
  items.forEach((item) => {
    if (item.mimeType){
      addFileToStarred(item);
    } else {
      addFolderToStarred(item);
    }
  });
};

export default {
  components: { ActionBar, FilesList, FoldersList, /*SortToggler,*/ SectionHeader, SearchForm, RenameForm, FolderNewForm, DropZone, UploaderPopup },
  setup () {

    const files   = ref([]);
    const folders = ref([]);

    const query = reactive({
      _sort    : 'name',
      _order   : 'asc',
      q        : '', // This is a JSON-server way to perform full-text search, we simply add q in query string and specify the search term.
      // folderId : 0, // we removed folderId from here and want to move it to another place
    });

    const folderId = ref(0);

    // create new variable to hold selected items
    const selectedItems = ref([]);

    const toast = reactive({
      show: false,
      message: ''
    });

    const modal = reactive({
      rename: false,
      newFolder: false
    });

    const choosenFiles = ref([]);

    const route  = useRoute();
    const router = useRouter();

    const handleSelectChange = (items) => {
      selectedItems.value = Array.from(items);
    };

    const handleFolderCreated = ( folder ) => {
      folders.value.push(folder);
      toast.message = `Folder ${folder.name} created.`;
      toast.show = true;
    };

    const addItemsToStarred = () => {
      addToStarred(selectedItems.value); // holds files/folders that's been selected

      // clear the selected items
      selectedItems.value.splice(0);
      toast.show = true;
      toast.message = 'Selected item(s) added to starred';
    };

    provide('setSelectedItem', handleSelectChange);

    const handleSortChange = (payload) => {
      query._sort  = payload.column;
      query._order = payload.order;
    };

    const handleRemove = () => {
      if (confirm('Are you sure ?')) {
        selectedItems.value.forEach((item) => {
          if (item.mimeType) {
            removeItem(item, files, filesApi.delete);
          } else {
            removeItem(item, folders, foldersApi.delete);
          }
        });

        // reset the selected items
        selectedItems.value.splice(0);

        toast.show    = true;
        toast.message = 'Selected item(s) successfully removed';
      }
    };

    // onMounted(async () => files.value = await fetchFiles(query));

    const handleRename = (items, newItem, entity) => {
      const oldItem = selectedItems.value[0];

      const index = items.value.findIndex(item => item.id === newItem.id );

      items.value.splice(index, 1, newItem);

      toast.show    = true;
      toast.message = `${entity} '${oldItem.name}' renamed to '${newItem.name}'`;
    };

    const handleFileUpdated = (file) => {
      handleRename(files, file, "File");
    };

    const handleFolderUpdated = (folder) => {
      handleRename(folders, folder, "Folder");
    };

    const handleUploadComplete = (item) => {
      files.value.push(item);
    };

    const handleDoubleClickFolder = (folder) => {
      // query.folderId = folder.id;

      router.push({ name: 'folders', params: { folderId: folder.id } })
    };

    watchEffect(async () => {
      // update the folderId from the route based on change on the URL structure,
      // ( which then based on the change in folderId, API request is made and then the
      // data is fetched again )
      folderId.value = route.params.folderId || 0;

      // const response = await fetchFoldersAndFiles(query);
      const response = await fetchFoldersAndFiles(folderId.value, query);

      files.value   = response.files;
      folders.value = response.folders;

      // put the folderId into history ( since, we're now using Vue router, we no longer need history.pushState, so commented out the below code )
      // history.pushState({}, '', `?${new URLSearchParams(query)}`);
    });

    // watch the folderId route params being changed
    watch(query, (newQuery) => {
      router.push({
        // name: 'folders',
        //  name can be route.name
        name: route.name,
        // params: { folderId: folderId.value },
        query: newQuery
      });
    });

    onMounted(() => {
      // console.log('Folder Id: ' + route.params.folderId);

      // we even remove this because vue-router can handle this
      // window.onpopstate = () => {
      //   Object.assign(query, Object.fromEntries(new URLSearchParams(window.location.search)));
      //   // alert('You hit back button');
      // };
    });

    // onUpdated(() => {
    //   console.log('Folder id: ' + route.params.folderId);
    // })

    // we can either use watch() or the above watchEffect()
    // watch (
    //   () => query._order,
    //   async () => files.value = await fetchFiles(query),
    //   { immediate: true }
    // );

    const isFile = computed(() => {
      if ( selectedItems.value.length === 1 && selectedItems.value[0].mimeType ) {
        return true;
      }
      return false;
    });

    return {
      files,
      folders,
      handleSortChange,
      q: toRef(query, 'q'),
      // folderId: toRef(query, 'folderId'), // we don't need 'folderId' from query
      folderId,
      handleSelectChange,
      addItemsToStarred,
      selectedItems,
      handleRemove,
      toast,
      modal,
      handleFileUpdated,
      handleFolderUpdated,
      choosenFiles,
      handleUploadComplete,
      handleDoubleClickFolder,
      renameFile: filesApi.update,
      renameFolder: foldersApi.update,
      isFile,
      handleFolderCreated
    };
  }
}

</script>