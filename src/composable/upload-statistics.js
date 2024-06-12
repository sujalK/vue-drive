import { computed } from "vue";
import states from "../components/uploader/states";

const useUploadStatistics = (items) => {
  const uploadingItemsCount = computed(() => {
    return items.value.filter(item => item.state === states.WAITING || item.state === states.UPLOADING).length;
  }).value;

  const failedItemsCount = computed(() => {
    return items.value.filter(item => item.state === states.CANCELED || item.state === states.FAILED).length;
  }).value;

  const processingItems = computed(() => {
    return items.value.filter(item => item.state !== states.CANCELED && item.state !== states.FAILED);
  });

  const processingItemsCount = processingItems.value.length;

  const processingItemsProgress = processingItems.value.reduce((total, item) => total + item.progress, 0);

  const completeItemsCount = computed( () => items.value.filter(item => item.state === states.COMPLETE).length ).value;

  return {
    uploadingItemsCount,
    completeItemsCount,
    failedItemsCount,
    processingItems,
    processingItemsCount,
    processingItemsProgress
  };
};


export default useUploadStatistics;