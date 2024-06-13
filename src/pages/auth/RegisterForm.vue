<template>
  <div class="auth-wrapper d-flex bg-light">
    <div class="col-md-4 m-auto">
      <div class="bg-white shadow-sm">
        <h1 class="text-center p-4 border-bottom text-uppercase">Register</h1>

        <div class="px-4 pt-4">

          <div class="alert alert-danger" v-if="errors">
            {{ errors }}
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label for="name" class="form-label">Name</label>
              <input
                type="text"
                class="form-control"
                id="name"
                v-model="form.name"
              />
            </div>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input
                type="email"
                class="form-control"
                id="email"
                v-model="form.email"
              />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                class="form-control"
                id="password"
                v-model="form.password"
              />
            </div>
            <div class="mt-4 d-grid">
              <button type="submit" class="btn btn-block btn-primary">Register</button>
              <div class="text-center py-4">
                Already have account?
                <router-link :to="{ name: 'login' }">Login</router-link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 92vh;
}
</style>

<script>
import { reactive, ref } from "vue";
import { register } from "../../api/auth";

import { setToken, setUser } from "../../store";
import { useRouter } from "vue-router";

export default {
  setup() {
    const form = reactive({
      name: "",
      email: "",
      password: "",
    });

    const router = useRouter();

    const errors = ref(null);

    const handleSubmit = async () => {
      try {

        const { data } = await register( form );

        // set token
        setToken(data.accessToken);

        // set user
        setUser(data.user);

        // redirect
        router.push({ name: 'my-files' });

      } catch (error) {

        console.log(error);

        if (error.response.status === 400) {
          errors.value = error.response.data.message
        }

      }
    };

    return { form, handleSubmit, errors };
  },
};
</script>