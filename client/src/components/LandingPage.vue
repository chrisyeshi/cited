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
      <section class="py-5 px-3 my-5">
        <v-container grid-list-lg>
          <v-layout column>
            <v-flex>
              <h1 class="mt-5 responsive-font-size">
                Discovery Engine
              </h1>
            </v-flex>
            <v-flex>
              <h3 class="title font-weight-light text-xs-center">
                A new paper discovery experience, for researchers, by researchers.
              </h3>
            </v-flex>
            <v-flex class="mt-4 text-xs-center action-buttons-container">
              <v-btn large dark color="cyan darken-4" to="/tour/0">Demo</v-btn>
              <v-btn large color="error" href="#sign-up">Sign Up</v-btn>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section class="py-5 my-5">
        <v-container>
          <v-layout row wrap align-center>
            <v-flex xs12 md6 style="height: 350px; overflow: hidden; display: flex; justify-content: center; position: relative;">
              <img ref="discovery" class="translateX"
                src="../assets/graph-eight.png" style="height: 100%;">
              <div class="fade-right hidden-sm-and-down"></div>
            </v-flex>
            <v-flex xs12 md6 class="py-5" :px-5="$vuetify.breakpoint.smAndUp"
              :px-4="$vuetify.breakpoint.xsOnly">
              <h2 class="display-1 font-weight-light">Paper Discovery</h2>
              <p class="subheading mt-4">
                We are so used to looking for new papers by tracing from the citations of the papers we found interesting. Discovery engine facilitates this habit with graph visualization, which allows us to not only search papers by content, but also discover papers by traversing the paper relationships.
              </p>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section class="py-5 my-5">
        <v-container>
          <v-layout row wrap align-center>
            <v-flex xs12 md6 order-md2 style="height: 350px; overflow: hidden; display: flex; align-content: center; position: relative;">
              <img src="../assets/comments-narrow.jpg" ref="community"
                class="translateY" style="position: absolute; width: 100%">
              <div class="fade-top-bottom hidden-sm-and-down"></div>
            </v-flex>
            <v-flex xs12 md6 order-md1 class="py-5" :px-5="$vuetify.breakpoint.smAndUp"
              :px-4="$vuetify.breakpoint.xsOnly">
              <h2 class="display-1 font-weight-light">Community</h2>
              <p class="subheading mt-4">
                We find exchanging ideas with others to be fundamentally important for research. Discovery engine aims to bring the research community together by allowing people to comment on and discuss about existing works.
              </p>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section class="py-5 my-5">
        <v-container>
          <v-layout row wrap align-center>
            <v-flex xs12 md6 style="position: relative;">
              <v-parallax height=350 class="collection"
                :src="getImgUrl('graph-insitu.png')">
              </v-parallax>
              <div class="fade-top-bottom"></div>
            </v-flex>
            <v-flex xs12 md6 class="py-5" :px-5="$vuetify.breakpoint.smAndUp"
              :px-4="$vuetify.breakpoint.xsOnly">
              <h2 class="display-1 font-weight-light">Reference Management</h2>
              <p class="subheading mt-4">
                With the most accurate paper database and graph visualization, discovery engine provides novel ways to collect and organize references. Manually editing bibliography files will finally become a history.
              </p>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section id="sign-up" class="py-5 mt-5 grey darken-3 white--text">
        <v-container grid-list-lg :px-5="$vuetify.breakpoint.smAndUp"
          :px-4="$vuetify.breakpoint.xsOnly">
          <h1 class="mt-2 pb-2 text--white">Sign up for product update:</h1>
          <v-form class="mt-2"
            :action="`https://formspree.io/${toEmail}`" method="POST">
            <v-layout wrap>
              <v-flex xs12 sm10>
                <v-text-field dark outline hide-details single-line
                  v-model="email" name="email" label="Email"
                  placeholder="im@email.com" id="email" required>
                </v-text-field>
              </v-flex>
              <v-flex xs12 sm2>
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
          to: '5%'
        }
      }
    })
    discovery.start()
    const community = basicScroll.create({
      elem: this.$refs.community,
      from: 'top-bottom',
      to: 'bottom-top',
      props: {
        '--ty': {
          from: '0%',
          to: '-30%'
        }
      }
    })
    community.start()
  }
}
</script>

<style scoped>
.responsive-font-size {
  text-align: center;
}

.container {
  max-width: 1185px;
  padding: 0px;
}

.action-buttons-container .v-btn {
  width: 130px;
}

.fade-right {
  position: absolute;
  right: 0px;
  display: block;
  width: 1%;
  height: 100%;
  background-image:
    linear-gradient(
      to right,
      rgba(250, 250, 250, 0.0),
      rgba(250, 250, 250, 1.0)
      100%);
}

.fade-top-bottom {
  position: absolute;
  top: 0px;
  display: block;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(
      to bottom,
      rgba(250, 250, 250, 1.0) 0%,
      rgba(250, 250, 250, 0.0) 2%,
      rgba(250, 250, 250, 0.0) 98%,
      rgba(250, 250, 250, 1.0) 100%);
}

@media screen and (min-width: 1080px) {
  .responsive-font-size {
    font-size: 75px;
  }
}

@media screen and (max-width: 1079px) {
  .responsive-font-size {
    font-size: 60px;
  }
}

@media screen and (max-width: 667px) {
  .responsive-font-size {
    font-size: 10vw;
  }
}

.translateX {
  transform: translateX(var(--tx));
  will-change: transform;
}

.translateY {
  transform: translateY(var(--ty));
  will-change: transform;
}
</style>
