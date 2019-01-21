<template>
  <v-flex>
    <v-toolbar dense>
      <v-toolbar-title>Edit Paper Info</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        :disabled="!valid"
        color="success"
        small
        outline
        @click="validate"
      >
        Save
      </v-btn>
      <v-btn
        color="error"
        small
        outline
        @click="$emit('editPaperInfoDone')"
      >
        Cancel
      </v-btn>
    </v-toolbar>
    <v-card>
      <v-container>
        <v-form
          ref="form"
          v-model="valid"
          lazy-validation
        >
          <v-text-field
            v-model="title"
            :rules="titleRules"
            label="Paper Title"
            required
          ></v-text-field>
          <v-text-field
            v-model="author"
            :rules="authorRules"
            label="Authors"
            required
          ></v-text-field>
        </v-form>
      </v-container>
    </v-card>
  </v-flex>
</template>

<script>
export default {
  data: () => ({
    valid: true,
    title: '',
    titleRules: [
      v => !!v || 'Paper title is required'
    ],
    author: '',
    authorRules: [
      v => !!v || 'At least one author name is required'
    ]
  }),

  methods: {
    setValues ({title, authors}) {
      this.title = title
      this.author = authors
    },
    validate () {
      if (this.$refs.form.validate()) {
        this.snackbar = true
      }
    },
    reset () {
      this.$refs.form.reset()
    },
    resetValidation () {
      this.$refs.form.resetValidation()
    }
  }
}
</script>
