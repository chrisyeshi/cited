<template>
  <v-app>
    <v-toolbar app flat scroll-off-screen inverted-scroll>
      <responsive-text-logo full @click="scrollToTop"></responsive-text-logo>
      <v-toolbar-items>
        <v-btn flat to="/tour/0">Demo</v-btn>
        <v-btn flat href="#sign-up">Sign Up</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content fluid>
      <section class="mb-5">
        <v-container>
          <h1 class="mt-4 responsive-font-size">
            Discovery Engine
          </h1>
          <h3 class="headline text-xs-center">
            A paper discovery and management tool for researchers helping researchers.
          </h3>
          <div class="text-xs-center" style="margin-bottom: 1em;">
            <v-btn large color="success" to="/tour/0">Demo</v-btn>
            <v-btn large color="error" href="#sign-up">Sign Up</v-btn>
          </div>
          <v-divider></v-divider>
          <section style="height: 350px; overflow: hidden; display: flex; justify-content: center;">
            <img ref="discovery" class="translateX" src="../assets/graph-five.png"
              style="height: 100%;">
          </section>
          <v-layout row wrap align-center>
            <v-flex xs12 md4>
              <v-card class="elevation-0 transparent">
                <v-card-title primary-title class="layout justify-center">
                  <div class="headline text-xs-center">Researcher-Centric Design</div>
                </v-card-title>
                <v-card-text>
                  Researchers are proposing cutting-edge ideas to transform the human race everyday.
                  However, current search engines and research assistant tools are not designed around researchers' habits,
                  in which researchers often need to manually traverse references and citations of interested papers.
                  Here we aim to provide a highly usable tool for researchers to easily discover the most relevant papers to their research tasks.
                </v-card-text>
              </v-card>
            </v-flex>
            <v-flex xs12 md4>
              <v-card class="elevation-0 transparent">
                <v-card-title primary-title class="layout justify-center">
                  <div class="headline text-xs-center">Smart Management</div>
                </v-card-title>
                <v-card-text>
                  Our tool can help researchers to effectively collect, organize and management related papers for different research topics.
                  For each collections of papers created by researchers, our tool automatically arrange and visualize the papers and their relationships in meaningful graphs.
                  Graph visualization allows people to see the inner relationships and identify the most important or influential papers.
                </v-card-text>
              </v-card>
            </v-flex>
            <v-flex xs12 md4>
              <v-card class="elevation-0 transparent">
                <v-card-title primary-title class="layout justify-center">
                  <div class="headline">Collaborative Discovery</div>
                </v-card-title>
                <v-card-text>
                  We aim to bring the research community together to help junior researchers.
                  Researchers can share these collections with their peers and also generate references from these collections to help them write papers.
                  We believe the community can help by providing anonymous reviews and comments.
                  Together, we can build a strong community and a database with the most accurate meta data of research papers.
                </v-card-text>
              </v-card>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <v-divider></v-divider>
      <section>
        <!-- <v-parallax height=350 class="community"
          :src="getImgUrl('hans-peter-gauster-1024-unsplash.jpg')">
        </v-parallax> -->
        <!-- Photo by Hans-Peter Gauster on Unsplash -->
      </section>
      <v-divider></v-divider>
      <section>
        <v-parallax height=350 class="collection"
          :src="getImgUrl('graph-insitu.png')">
        </v-parallax>
      </section>
      <v-divider></v-divider>
      <section class="mb-5">
        <v-container>
          <h1 class="mt-2">Why We Build This Tool</h1>
          <p class="mt-3 subheading">
            We are so used to looking for new papers based on the references/citations of the papers we found interesting. However, it is surprising that no tool is providing this functionality.
            After we read a paper, we often have questions, comments, and even new ideas that we want to discuss with other researchers. However, there isn’t a place for this.
          </p>
        </v-container>
      </section>
      <v-divider></v-divider>
      <section id="sign-up" class="pb-5 grey darken-3 white--text">
        <v-container>
          <h1 class="mt-2 text--white">Sign up for product update:</h1>
          <v-form class="mt-2"
            :action="`https://formspree.io/${toEmail}`" method="POST">
            <v-layout wrap>
              <v-flex xs12 sm10>
                <v-text-field dark outline hide-details single-line
                  v-model="email" name="email" label="Email"
                  placeholder="im@email.com" id="email" required>
                </v-text-field>
              </v-flex>
              <v-flex xs12 sm2 :pl-3="$vuetify.breakpoint.smAndUp">
                <v-btn large block type="submit">Submit</v-btn>
              </v-flex>
            </v-layout>
          </v-form>
        </v-container>
      </section>
    </v-content>
  </v-app>
</template>

<script>
import ResponsiveTextLogo from './ResponsiveTextLogo.vue'
import * as basicScroll from 'basicscroll'

export default {
  name: 'LandingPage',
  components: {
    ResponsiveTextLogo
  },
  data () {
    return {
      email: ''
    }
  },
  methods: {
    getImgUrl (img) {
      return require('../assets/' + img)
    },
    scrollToTop () {
      window.scrollTo({ top: 0 })
    }
  },
  computed: {
    toEmail () {
      return process.env.LANDING_EMAIL
    }
  },
  mounted () {
    const discovery = basicScroll.create({
      elem: this.$refs.discovery,
      from: 'top-bottom',
      to: 'bottom-top',
      props: {
        '--tx': {
          from: '-15%',
          to: '15%'
        }
      }
    })
    discovery.start()
  }
}
</script>

<style scoped>
.responsive-font-size {
  text-align: center;
}

@media screen and (min-width: 668px) {
  .responsive-font-size {
    font-size: 60px;
  }
}

@media screen and (max-width: 667px) {
  .responsive-font-size {
    font-size: 9vw;
  }
}

.translateX {
  transform: translateX(var(--tx));
  will-change: transform;
}
</style>
