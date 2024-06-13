<template>
  <div class="container-fluid">
    <div
      class="
        pt-2
        pb-3
        border-bottom
        d-flex
        justify-content-between
        align-items-center
      "
    >
      <span class="h5 mb-0">Starred</span>
      <a
        href="#"
        class="rounded-button"
        title="Remove from starred"
        v-if="selectedItems.length"
        @click.prevent="removeFromStarred"
      >
        <icon-star />
      </a>
    </div>
    <div class="pt-3">
      <SectionHeader title="Folders" />
      <!-- <div>{{ folders }}</div> -->
      <FoldersList
        :folders="folders"
        v-if="folders.length"
        @double-click="$router.push({ name: 'folders',  params: { folderId: $event.id } })"
        @select-change="handleSelectChange"
      />


      <SectionHeader title="Files" />
      <!-- <div>{{ files }}</div> -->
      <FilesList
        :files="files" v-if="files.length"
        @select-change="handleSelectChange"
      />

    </div>
    <app-toast
      :show="toast.show"
      :message="toast.message"
      type="success"
      position="bottom-left"
      @hide="toast.show = false"
    />
  </div>
</template>
<script>
import { reactive, ref, onMounted } from 'vue';

import IconStar from '../components/icons/IconStar.vue';

import SectionHeader from '../components/files/SectionHeader.vue';

import { starredFiles, starredFolders } from '../api/starred';
import { removeFileFromStarred, removeFolderFromStarred } from '../api/starred';

import FoldersList from "../components/files/FoldersList.vue";
import FilesList from "../components/files/FilesList.vue";

const fetchStarredFoldersAndFiles = async () => {
  try {
    const { data: folders } = await starredFolders();
    const { data: files }   = await starredFiles();

    return { folders, files };
  } catch (error) {
    console.error(error);
  }
};

const removeItem = async (item, items, fn) => {
  try {
    const response = await fn(item);

    if ( response.status === 200 || response.status === 204 ) {
      const index = items.value.findIndex(i => i.id === item.id); // changed i because it's item (could either be file or folder)
      items.value.splice(index, 1);
    }

  } catch (err) {
    console.error('Error: ' + err);
  }

};

export default {
  components: { SectionHeader, IconStar, FoldersList, FilesList },
  setup () {
    const toast = reactive({
      show    : false,
      message : '',
    });

    const folders = ref([]);
    const files   = ref([]);

    const selectedItems = ref([]);

    const handleSelectChange = (items) => {
      selectedItems.value = Array.from(items);
    };

    const removeFromStarred = () => {
      selectedItems.value.forEach((item) => {
        if ( item.mimeType ) { // if item has mimeType, means it's a file
          removeItem(item, files, removeFileFromStarred);
        } else {
          // if the item has no mimeType, meaning it is a folder
          removeItem(item, folders, removeFolderFromStarred);
        }
      });

      //  reset the selected items
      selectedItems.value.splice(0);

      // show the toast message
      toast.show    = true;
      toast.message = 'Selected items(s) removed from starred';
    };

    onMounted(async () => {
      const response = await fetchStarredFoldersAndFiles();
      folders.value = response.folders;
      files.value   = response.files;
    });

    return {
      toast,
      folders,
      files,
      selectedItems,
      handleSelectChange,
      removeFromStarred
    };
  }
};
</script>