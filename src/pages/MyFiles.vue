<template>
  <div class="container">
    <ActionBar
      :selected-count="selectedItems.length"
      @remove="handleRemove"
      @rename="modal.rename = true"
      @files-choosen="choosenFiles = $event"
      @create-folder="modal.newFolder = true"
    />

    <!-- sort-toggler thing is removed from here and moved into component -->

    <teleport to="#search-form">
      <SearchForm v-model="q" />
    </teleport>

    <DropZone @files-dropped="choosenFiles = $event" :show-message="!files.length && !folders.length">
      <SectionHeader title="Folders" @sort-change="handleSortChange" v-if="folders.length" sort-toggler /> <!-- :sort-toggler is equivalent to :sort-toggler="true" -->
      <FoldersList @double-click="handleDoubleClickFolder" :folders="folders" @select-change="handleSelectChange($event)" :selected="selectedItems" />
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

import { onMounted, ref, reactive, watchEffect, toRef, provide, computed } from "vue";


const getPath = (query) => {
  let folderPath = 'folders';
  let filePath   = 'files';

  if ( query.folderId > 0 ) {
    const basePath = `folders/${query.folderId}`;
    folderPath     = `${basePath}/${folderPath}`;
    filePath       = `${basePath}/${filePath}`;
  }

  return { folderPath, filePath };
};

const fetchFoldersAndFiles = async (query) => {
  try {
    const { folderPath, filePath } = getPath(query);

    // we renamed data to files ( alias ), because we're going to make API calls
    // to two endpoints: files and folders
    const { data: folders } = await foldersApi.index(query, folderPath);
    const { data: files }   = await filesApi.index(query, filePath);

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

export default {
  components: { ActionBar, FilesList, FoldersList, /*SortToggler,*/ SectionHeader, SearchForm, RenameForm, FolderNewForm, DropZone, UploaderPopup },
  setup () {

    const files   = ref([]);
    const folders = ref([]);

    const query = reactive({
      _sort    : 'name',
      _order   : 'asc',
      q        : '', // This is a JSON-server way to perform full-text search, we simply add q in query string and specify the search term.
      folderId : 0
    });

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

    const handleSelectChange = (items) => {
      selectedItems.value = Array.from(items);
    };

    const handleFolderCreated = ( folder ) => {
      folders.value.push(folder);
      toast.message = `Folder ${folder.name} created.`;
      toast.show = true;
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
      query.folderId = folder.id;
    };

    watchEffect(async () => {
      const response = await fetchFoldersAndFiles(query);

      files.value   = response.files;
      folders.value = response.folders;

      // put the folderId into history
      history.pushState({}, '', `?${new URLSearchParams(query)}`);
    });


    onMounted(() => {
      window.onpopstate = () => {
        Object.assign(query, Object.fromEntries(new URLSearchParams(window.location.search)));
        // alert('You hit back button');
      };
    });

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
      folderId: toRef(query, 'folderId'),
      handleSelectChange,
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