<template>
  <form @submit.prevent="handleSubmit">
    <input v-highlight type="text" class="form-control" v-model="name" />
    <div class="d-flex flex-row-reverse mt-3">
      <button class="btn btn-primary" type="submit">OK</button>
      <button class="btn btn-outline-secondary me-2" @click.prevent="$emit('close')">Cancel</button>
    </div>
  </form>
</template>
<script>
import { nextTick } from 'vue';

export default {
  props: {
    // file: {
    data: {  // changed name from file to data
      type: Object,
      required: true,
    },
    submit: {
      type: Function,
      required: true
    }
  },
  // moved directives to global directives, because we'll need it for FolderNewFoorm
  // directives: {
  //   highlight: {
  //     mounted(el) {
  //       nextTick(() => {
  //
  //         let selectionEnd = el.value.length;
  //
  //         if ( el.value.includes('.') ) {
  //           selectionEnd = el.value.split('.').slice(0, -1).join('.').length;
  //         }
  //
  //         el.setSelectionRange(0, selectionEnd);
  //
  //       });
  //
  //       el.focus();
  //     }
  //   }
  // },
  data() {
    return {
      name: this.data.name,
    }
  },
  methods: {
    async handleSubmit() {
      try {
        const { data } = await this.submit({ name: this.name }, this.data.id);

        this.$emit('updated', data);
        this.$emit('close');
        console.log('File updated: ', data);
      } catch ( err ) {
        console.log( 'Err: ' + err );
      }
    }
  },
  emits: ['updated', 'close']
}
</script>