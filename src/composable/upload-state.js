import states from '../components/uploader/states';
import {  computed } from "vue";

const useUploadStates = (item) => {
  const isCanceled  = computed( () => item.state ===  states.CANCELED );
  const isUploading = computed( () => item.state ===  states.WAITING || item.state === states.UPLOADING );
  const isFailed    = computed( () => item.state ===  states.FAILED );
  const isComplete  = computed( () => item.state ===  states.COMPLETE );

  return { isCanceled, isUploading, isFailed, isComplete };
};

export default useUploadStates;