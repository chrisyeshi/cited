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
            v-model="paper.title"
            :rules="titleRules"
            label="Paper Title"
            required
          ></v-text-field>
          <v-text-field
            v-model="authorNames"
            :rules="authorRules"
            label="Authors"
            required
          ></v-text-field>
          <v-textarea
            rows=12
            v-model="paper.abstract"
            label="Abstract"
          ></v-textarea>
          <v-text-field
            v-model="paper.keywords"
            label="Keywords"
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
    titleRules: [
      v => !!v || 'Paper title is required'
    ],

    authorRules: [
      v => !!v || 'At least one author name is required'
    ],
    paper: {
      title: '',
      authorNames: '',
      authors: [],
      keywords: '',
      abstract: ''
    },
    authorNames: ''
  }),

  methods: {
    setValues (paper) {
      Object.assign(this.paper, paper)
      this.authorNames = this.paper.authorNames.join(', ')
    },
    validate () {
      if (this.$refs.form.validate()) {
        this.snackbar = true
        this.paper.authorNames = this.authorNames.split(',').map(name => name.trim())
        this.$emit('editPaperInfoDone', this.paper)
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
