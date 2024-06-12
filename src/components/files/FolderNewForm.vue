<template>
  <form @submit.prevent="handleSubmit">
    <input v-highlight type="text" class="form-control" v-model="name" />
    <div class="d-flex flex-row-reverse mt-3">
      <button class="btn btn-primary" type="submit">Create</button>
      <button class="btn btn-outline-secondary me-2" @click.prevent="$emit('close')">Cancel</button>
    </div>
  </form>
</template>
<script>
import { nextTick } from 'vue';
import foldersApi from '../../api/folders';

export default {
  props: {
    folderId: {
      type    : [ Number, String ],
      default : 0
    }
  },
  // directives: {
  //   highlight: {
  //     mounted(el) {
  //       nextTick(() => {
  //         const selectionEnd = el.value.split('.').slice(0, -1).join('.').length;
  //
  //         el.setSelectionRange(0, selectionEnd);
  //       });
  //
  //       el.focus();
  //     }
  //   }
  // },
  data() {
    return {
      name: 'Untitled folder',
    }
  },
  methods: {
    async handleSubmit() {
      try {
        const { data } = await foldersApi.create({
          name: this.name,
          folderId: this.folderId
        });

        this.$emit('folder-created', data); // data is the response data
        this.$emit('close');
        console.log('File updated: ', data);
      } catch ( err ) {
        console.log( 'Err: ' + err );
      }
    }
  },
  emits: ['folder-created', 'close']
}
</script>