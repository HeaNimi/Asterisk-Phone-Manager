<script setup lang="ts">
const manager = useManagerData();
const { contacts } = manager;
const contact = reactive<Record<string, unknown>>({
  name: "",
  number: "",
  description: "",
  speedDial: "",
});
async function save() {
  await manager.saveContact({ ...contact });
  Object.assign(contact, {
    name: "",
    number: "",
    description: "",
    speedDial: "",
  });
}
async function remove(id: string) {
  if (confirm("Delete this contact?")) await manager.deleteContact(id);
}
onMounted(manager.load);
</script>

<template>
  <AppShell>
    <div class="page-grid">
      <form class="card grid" @submit.prevent="save">
        <h2>Add contact</h2>
        <p class="muted">Publish a shared directory to configured phones.</p>
        <label>Name<input v-model="contact.name" required /></label
        ><label>Number<input v-model="contact.number" required /></label
        ><label>Description<input v-model="contact.description" /></label
        ><label>Speed dial<input v-model="contact.speedDial" /></label
        ><UButton label="Save contact" icon="lucide:save" type="submit" />
      </form>
      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Directory</h2>
            <p class="muted">
              Contacts available to the phone directory endpoint.
            </p>
          </div>
          <span class="count">{{ contacts.length }}</span>
        </div>
        <div v-for="item in contacts" :key="item.id" class="contact-row">
          <div>
            <strong>{{ item.name }}</strong
            ><span
              >{{ item.number
              }}<template v-if="item.description">
                · {{ item.description }}</template
              ></span
            >
          </div>
          <UButton
            label="Delete"
            color="error"
            variant="soft"
            size="sm"
            type="button"
            @click="remove(item.id)"
          />
        </div>
        <p v-if="!contacts.length" class="muted">No contacts yet.</p>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.page-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.7fr) minmax(0, 1.3fr);
  gap: 1rem;
}
.card h2 {
  margin: 0;
  font-size: 1.05rem;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
}
.section-heading p {
  margin: 0.25rem 0;
}
.count {
  display: grid;
  place-items: center;
  min-width: 25px;
  height: 23px;
  border-radius: 99px;
  background: #edf2fa;
  color: #526176;
  font-size: 0.72rem;
  font-weight: 700;
}
.contact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5ebf2;
}
.contact-row strong,
.contact-row span {
  display: block;
}
.contact-row span {
  color: #6f7c91;
  font-size: 0.78rem;
  margin-top: 0.2rem;
}
@media (max-width: 750px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
