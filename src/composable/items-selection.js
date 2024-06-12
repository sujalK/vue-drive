import { reactive } from 'vue';

// we moved it outside because we share it with filesList and foldersList component
// if we keep inside function, we cannot do multiple selections on folder items, and
// files items. That's why we need to put outside.
const selectedItems = reactive(new Set());

const useItemsSelection = (selected, emit) => {

  const selectOne = (item) => {
    selectedItems.clear();
    selectedItems.add(item);

    emit('select-change', selectedItems);
  };

  const selectMultiple = (item) => {
    if (selectedItems.has(item)) {
      selectedItems.delete(item);
    } else {
      selectedItems.add(item);
    }

    emit('select-change', selectedItems);
  };

  const isSelected = (item) => selectedItems.has(item) || selected.length && selected[0].id === item.id && selected[0].mimeType;

  const clearSelected = () => {
    selectedItems.clear();
    emit('select-change', selectedItems);
  };

  return {
    selectOne,
    selectMultiple,
    isSelected,
    clearSelected
  }
};

export default useItemsSelection;