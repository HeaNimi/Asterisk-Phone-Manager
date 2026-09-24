<script setup lang="ts">
const route = useRoute();
const manager = useManagerData();
const { auth } = manager;
const noticeMessage = computed(() => manager.message.value.trim());
const noticeError = computed(() => manager.error.value.trim());

const navigation = [
  { to: "/", label: "Overview", icon: "lucide:layout-dashboard" },
  { to: "/phones", label: "Phones", icon: "lucide:phone" },
  { to: "/phonebook", label: "Phonebook", icon: "lucide:contact-round" },
  { to: "/tftp", label: "TFTP assets", icon: "lucide:files" },
  { to: "/cisco-xml", label: "Cisco XML", icon: "lucide:file-code-2" },
  { to: "/deployment", label: "Deployment", icon: "lucide:settings-2" },
];

const pageTitle = computed(
  () => navigation.find((item) => item.to === route.path)?.label || "Overview",
);
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <NuxtLink to="/" class="brand" aria-label="Talk Admin overview">
        <span class="brand-mark"
          ><Icon name="lucide:phone-call" size="17" aria-hidden="true"
        /></span>
        <span
          ><strong>Talk Admin</strong><small>Phone configuration</small></span
        >
      </NuxtLink>
      <nav class="side-nav" aria-label="Primary navigation">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          exact-active-class="active"
        >
          <Icon
            class="nav-marker"
            :name="item.icon"
            size="16"
            aria-hidden="true"
          />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
      <div class="sidebar-foot">
        <span class="account"
          >{{ auth?.username || "Administrator"
          }}<small>Administrator</small></span
        >
        <UButton
          icon="lucide:log-out"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Sign out"
          @click="manager.logout"
        />
      </div>
    </aside>
    <main class="content">
      <header class="topbar">
        <div>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="top-actions">
          <UButton
            icon="lucide:log-out"
            label="Sign out"
            color="neutral"
            variant="soft"
            @click="manager.logout"
          />
        </div>
      </header>
      <UAlert
        v-if="noticeMessage"
        icon="lucide:check-circle-2"
        :title="noticeMessage"
        color="success"
        variant="subtle"
        class="mb-4"
      />
      <UAlert
        v-else-if="noticeError"
        icon="lucide:circle-alert"
        :title="noticeError"
        color="error"
        variant="subtle"
        class="mb-4"
      />
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr);
  background: #f7f9fc;
}
.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.15rem 0.8rem;
  background: #162033;
  color: #c9d2e1;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.35rem 0.55rem 1.7rem;
  color: #fff;
  text-decoration: none;
}
.brand strong {
  display: block;
  font-size: 0.95rem;
}
.brand small,
.sidebar-foot small {
  display: block;
  color: #8693a8;
  font-size: 0.68rem;
  margin-top: 0.16rem;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border-radius: 8px;
  background: #4779d8;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.side-nav {
  display: grid;
  gap: 0.2rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.66rem 0.7rem;
  border-radius: 7px;
  color: #aab7ca;
  font-size: 0.82rem;
  text-decoration: none;
}
.nav-item:hover,
.nav-item.active {
  background: #25344d;
  color: #fff;
}
.nav-item.active {
  box-shadow: inset 3px 0 #73a1ff;
}
.nav-marker {
  width: 23px;
  color: #86a9ec;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}
.sidebar-foot {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: auto;
  padding: 0.8rem 0.35rem 0;
  border-top: 1px solid #2b3950;
  font-size: 0.78rem;
}
.account {
  flex: 1;
}
.content {
  min-width: 0;
  padding: 1.45rem 2.1rem 3rem;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.topbar h1 {
  margin: 0.15rem 0;
  font-size: 1.5rem;
  color: #182236;
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.64rem;
  font-weight: 800;
  color: #71809a;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
@media (max-width: 850px) {
  .app-shell {
    display: block;
  }
  .sidebar {
    min-height: auto;
    padding: 0.75rem 1rem;
  }
  .brand {
    padding-bottom: 0.75rem;
  }
  .side-nav {
    display: flex;
    overflow: auto;
  }
  .nav-item {
    white-space: nowrap;
  }
  .sidebar-foot {
    display: none;
  }
  .content {
    padding: 1.1rem 1.15rem 2rem;
  }
}
@media (max-width: 600px) {
  .topbar {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 1.1rem;
  }
  .top-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
