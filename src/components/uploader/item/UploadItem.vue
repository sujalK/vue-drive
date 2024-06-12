<template>
  <li class="list-group-item d-flex justify-content-between align-items-center">
    <p :class="uploadItemClasses">
<!--      <icon-type-common />-->
      <!-- commented the above code with the new one below to put the dynamic component as shown below. -->
      <component :is="iconFileType" />
      <span>{{ item.file.name }}</span>
    </p>
    <span class="failed-text" v-show="isCanceled">Upload Canceled</span>
    <UploadControls
      :item="item"
      @cancel="handleCancel"
      @retry="handleRetry"
      @locate="handleLocate"
    />
  </li>
</template>

<script>
import { computed, onMounted, reactive, watch, inject } from 'vue';

import IconTypeCommon from "../../icons/IconTypeCommon.vue";
import { useIconFileType } from "../../../composable/icon-file-type";

import filesApi from '../../../api/files.js';
import states from "../states.js";

import axios from "axios";

import UploadControls from "./UploadControls.vue";

import useUploadStates from '../../../composable/upload-state';

const createFormData = (upload) => {
  const formData = new FormData();
  formData.append('file', upload.file);
  formData.append('folderId', upload.folderId);

  return formData;
};

const startUpload = async (upload, source) => {
  try {
    upload.state = states.UPLOADING;

    // formData object or the object that holds files that's going to be uploaded to server without
    // us having to create form element in our template.
    const { data } = await filesApi.create(createFormData(upload), {
      onUploadProgress: (e) => {
        if (e.lengthComputable) {
          upload.progress = Math.round((e.loaded / e.total) * 100)
        }
      },
      cancelToken: source.token
    });

    // after uploading success, make the state to COMPLETE
    upload.state    = states.COMPLETE;
    upload.response = data;

  } catch (error) {

    if (!axios.isCancel(error)) {
      upload.state = states.FAILED;
    }

    upload.progress = 0;
  }
};

export default {
  components: { IconTypeCommon, UploadControls },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {

    const uploadItem = reactive(props.item);
    console.log(uploadItem);

    let source = axios.CancelToken.source();

    const { isCanceled } = useUploadStates(uploadItem);

    const handleRetry = () => {
      source = axios.CancelToken.source();
      startUpload(uploadItem, source);
    };

    const uploadItemClasses = computed(() => ({
      'upload-item': true,
      'failed': isCanceled.value
    }));

    const setSelectedItem = inject('setSelectedItem');
    const handleLocate = () => {
      setSelectedItem([uploadItem.response]);
    };

    onMounted(() => startUpload(uploadItem, source));

    watch(() => [uploadItem.progress, uploadItem.state], () => {
      if ( uploadItem.state === states.CANCELED ) {
        source.cancel();
      } else if ( uploadItem.state === states.WAITING ) {
        handleRetry();
      }

      emit('change', uploadItem);
    });

    const handleCancel = () => {
      uploadItem.state = states.CANCELED;
      // source.cancel();
    };

    return {
      iconFileType: useIconFileType(props.item.file.type),
      uploadItem,
      handleCancel,
      handleRetry,
      isCanceled,
      uploadItemClasses,
      handleLocate
    };
  },
  emits: ['change']
}
</script>

<style scoped>

.upload-item,
.failed-text {
  color: #6c757d;
}

.upload-item span,
.failed-text {
  font-size: 12px;
}

.upload-item span {
  margin-left: 6px;
}

.failed {
  width: 140px;
  color: #212529;
}
</style>