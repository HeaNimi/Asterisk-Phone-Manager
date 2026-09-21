<script setup lang="ts">
const form = reactive({ username: 'admin', password: '' })
const error = ref('')
const setup = ref(false)
const setupAvailable = ref(false)
const setupForm = reactive({ username: 'admin', password: '', confirm: '' })

async function login() {
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form })
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Login failed'
  }
}

async function create() {
  error.value = ''
  if (setupForm.password !== setupForm.confirm) {
    error.value = 'Passwords do not match'
    return
  }
  try {
    await $fetch('/api/auth/setup', { method: 'POST', body: { username: setupForm.username, password: setupForm.password } })
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Setup failed'
  }
}

onMounted(async () => {
  try {
    setupAvailable.value = (await $fetch<{ available: boolean }>('/api/auth/setup')).available
  } catch {
    setupAvailable.value = false
  }
})
</script>

<template>
  <main class="login-layout">
    <section class="card login-card">
      <h1>Asterisk Phone Manager</h1>
      <p class="muted">Local single-admin console</p>
      <form v-if="!setup" class="grid" @submit.prevent="login">
        <label>Username<input v-model="form.username" autocomplete="username" required></label>
        <label>Password<input v-model="form.password" type="password" autocomplete="current-password" required></label>
        <UButton label="Sign in" type="submit" />
        <UButton v-if="setupAvailable" label="First-time setup" type="button" color="neutral" variant="soft" @click="setup=true" />
      </form>
      <form v-else class="grid" @submit.prevent="create">
        <label>Admin username<input v-model="setupForm.username" required></label>
        <label>Password<input v-model="setupForm.password" type="password" autocomplete="new-password" required></label>
        <label>Confirm password<input v-model="setupForm.confirm" type="password" autocomplete="new-password" required></label>
        <UButton label="Create admin" type="submit" />
        <UButton label="Back to login" type="button" color="neutral" variant="soft" @click="setup=false" />
      </form>
      <UAlert v-if="error" icon="lucide:circle-alert" :title="error" color="error" variant="subtle" />
    </section>
  </main>
</template>

<style scoped>
.login-layout{min-height:100vh;display:grid;place-items:center;padding:1rem}.login-card{width:min(420px,100%)}.login-card h1{margin-top:0}
</style>
