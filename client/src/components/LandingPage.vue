<template>
  <v-app>
    <v-toolbar app flat scroll-off-screen inverted-scroll>
      <responsive-text-logo full @click="scrollToTop"></responsive-text-logo>
      <v-toolbar-items>
        <v-btn flat to="/tour/0">Demo</v-btn>
        <v-btn flat href="#sign-up">Sign Up</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <section class="mb-5">
        <v-container>
          <h1 class="mt-4 responsive-font-size">
            Discovery Engine
          </h1>
          <h3 class="headline text-xs-center">
            A research paper discovery tool that fits researchers’ habits.
          </h3>
          <p class="mt-4 subheading">
            Researchers are proposing cutting-edge ideas to transform the human race everyday. However, the software for discovering and communicating new research is becoming obsolete. The biggest problem we have with the existing tools is that they are not designed around researchers' habits.
            <!-- In particular, there is no easy way to traverse multiple papers' references/citations to discover new works. Our solution allows researchers to intuitively traverse the vast network of research papers by utilizing graph visualization techniques and set theory. Furthermore, we aim to bring the research community together by allowing researchers to create and share paper collections as well as anonymous paper reviews. -->
          </p>
          <div class="text-xs-center">
            <v-btn large color="success" to="/tour/0">Demo</v-btn>
            <v-btn large color="error" href="#sign-up">Sign Up</v-btn>
          </div>
        </v-container>
      </section>
      <v-divider></v-divider>
      <section style="height: 350px; overflow: hidden; display: flex; justify-content: center;">
        <img ref="discovery" class="translateX" src="../assets/graph-five.png"
          style="height: 100%;">
      </section>
      <v-divider></v-divider>
      <section class="mb-5">
        <v-container>
          <h1 class="mt-2">Research Discovery</h1>
          <p class="mt-3 subheading">
            Other than a general search engine for research works, we believe we can further utilize the relationships between papers, namely references and citations. By incoporating graph visualization, we aim to allow researchers to easily traverse the citation network of papers, which we believe many researchers have been doing manually.
          </p>
        </v-container>
      </section>
      <v-divider></v-divider>
      <section>
        <v-parallax height=350 class="community"
          :src="getImgUrl('hans-peter-gauster-1024-unsplash.jpg')">
        </v-parallax>
        <!-- Photo by Hans-Peter Gauster on Unsplash -->
      </section>
      <v-divider></v-divider>
      <section class="mb-5">
        <v-container>
          <h1 class="mt-2">Community</h1>
          <p class="mt-3 subheading">
            We aim to bring the research community together to help junior researchers. We believe the community can help by providing anonymous reviews and comments. Furthermore, we aim to collaboratively build a database with the most accurate meta data of research papers. This database can then be used as the groundtruth for citing research works.
          </p>
        </v-container>
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
          <h1 class="mt-2">Manage Paper Collections</h1>
          <p class="mt-3 subheading">
            Researchers can create paper collections of their liking. Graph visualization allows people to see the inner relationships of the papers. Researchers can share these collections with their peers and also generate references from these collections to help them write papers.
          </p>
        </v-container>
      </section>
      <section id="sign-up" class="pb-5 grey darken-3 white--text">
        <v-container>
          <h1 class="mt-2 text--white">Sign up to get product notification:</h1>
          <!-- <p class="mt-3 subheading">Sign up to get product notification.</p> -->
          <v-text-field dark solo outline hide-details single-line
            class="mt-2"
            v-model="email"
            name="email"
            label="Email"
            placeholder="im@gmail.com"
            id="signUp"
            append-icon="send"
            @click:append="send"
          ></v-text-field>
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
    send () {
      console.log(this.email)
    },
    scrollToTop () {
      window.scrollTo({ top: 0 })
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
