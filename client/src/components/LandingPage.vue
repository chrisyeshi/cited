<template>
  <v-app>
    <v-toolbar app flat scroll-off-screen inverted-scroll>
      <v-toolbar-title class="page-title">Cited</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn flat @click="$emit('input', true)"
          v-ga="$ga.event.bind(this, 'buttons', 'click', 'toolbar demo')">
          Explore
        </v-btn>
        <v-btn flat @click="signIn" color="error"
          v-ga="$ga.event.bind(this, 'buttons', 'click', 'toolbar sign up')">
          Sign In
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <section class="py-6 px-3 my-5">
        <v-container grid-list-lg>
          <v-layout column>
            <v-flex class="mt-5"
              style="display: flex; justify-content: center;">
              <div style="position: relative;">
                <h1 style="font-family: 'Lora', serif; font-size: 100px;">
                  Cited
                </h1>
                <p class="title white--text px-2 py-1"
                  style="position: absolute; top: -8px; right: -20px; border-radius: 25px; background: #FC5457;">
                  alpha
                </p>
              </div>
            </v-flex>
            <v-flex>
              <v-layout row>
                <v-flex xs12 offset-sm1 sm10 offset-md2 md8 tag="h3"
                  class="title font-weight-light text-xs-center"
                  style="line-height: 125% !important;">
                    A better paper discovery experience, for researchers, by researchers.
                </v-flex>
              </v-layout>
            </v-flex>
            <v-flex class="mt-4 text-xs-center action-buttons-container">
              <v-btn large dark color="cyan darken-4"
                @click="$emit('input', true)"
                v-ga="$ga.event.bind(this, 'buttons', 'click', 'center demo')">
                Explore
              </v-btn>
              <v-btn large color="error" @click="signIn"
                v-ga.click="$ga.event.bind(this, 'buttons', 'click', 'center sign up')">
                Sign In
              </v-btn>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section class="py-6 my-5">
        <v-container class="px-4">
          <v-layout row>
            <v-flex xs12 sm10 offset-md1>
              <h2 class="display-1 font-weight-light text-xs-center">
                Literature Study Made Easy.
              </h2>
              <p class="mt-4 subheading">
                As researchers, we juggle multiple tools (e.g. Google Scholar, Mandeley, etc.) to find and organize our references. We find the current user experience severely outdated and many aspects can tailor more to researchers' habits, especially the way we find new papers from related works of the papers we read.
              </p>
              <p class="subheading">
                We are in the early stage of building a one-stop solution to facilitate literature study. The core technology that binds everything together is a graph visualization to represent the citation network. The biggest challenge we are facing is building the highest fidelity paper database. Here we invite you to join our journey.
              </p>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section class="py-6 my-5">
        <v-container class="px-4">
          <v-layout row>
            <v-flex xs12 sm10 offset-md1>
              <h2 class="display-2 font-weight-light text-xs-center">
                Our Goals.
              </h2>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section class="py-6 my-5">
        <v-container>
          <v-layout row wrap align-center>
            <v-flex xs12 md6 style="height: 350px; overflow: hidden; display: flex; justify-content: center; position: relative;">
              <img ref="discovery" class="translateX"
                src="../assets/graph-eight-min.png" style="height: 100%;">
              <div class="hidden-sm-and-down" :style="fadeLeft"></div>
              <div class="hidden-sm-and-down" :style="fadeRight"></div>
            </v-flex>
            <v-flex xs12 md6 class="py-5" :px-5="$vuetify.breakpoint.smAndUp"
              :px-4="$vuetify.breakpoint.xsOnly">
              <h2 class="display-1 font-weight-light">Graph Visualization</h2>
              <p class="subheading mt-4">
                We are so used to looking for new papers by tracing from the citations of the papers we found interesting.
              </p>
              <p class="subheading">
                Discovery engine facilitates this habit with graph visualization, which allows us to not only search papers by content, but also discover papers by traversing the paper relationships.
              </p>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section class="py-6 my-5">
        <v-container>
          <v-layout row wrap align-center>
            <v-flex xs12 md6 order-md2 style="height: 350px; overflow: hidden; display: flex; align-content: center; position: relative;">
              <img src="../assets/comments-narrow-min.jpg" ref="community"
                class="translateY" style="position: absolute; width: 100%">
              <div :style="fadeTop"></div>
              <div :style="fadeBottom"></div>
            </v-flex>
            <v-flex xs12 md6 order-md1 class="py-5" :px-5="$vuetify.breakpoint.smAndUp"
              :px-4="$vuetify.breakpoint.xsOnly">
              <h2 class="display-1 font-weight-light">Reputation System</h2>
              <p class="subheading mt-4">
                Manually making sure our bibliography entries are correct is annoying. We are dedicated to build a groundtruth database of bibliographies by allowing reputable community members to edit our database entries.
              </p>
              <p class="subheading">
                Also, we aim to encourage collaboration of the research community by allowing reputable members to anonymously comment on papers.
              </p>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section class="py-6 my-5">
        <v-container>
          <v-layout row wrap align-center>
            <v-flex xs12 md6 order-md1 style="position: relative;">
              <v-parallax height=350 class="collection"
                :src="getImgUrl('graph-insitu-min.png')">
              </v-parallax>
              <div :style="fadeTop"></div>
              <div :style="fadeBottom"></div>
            </v-flex>
            <v-flex xs12 md6 order-md2 class="py-5"
              :px-5="$vuetify.breakpoint.smAndUp"
              :px-4="$vuetify.breakpoint.xsOnly">
              <h2 class="display-1 font-weight-light">Reference Management</h2>
              <p class="subheading mt-4">
                With the most accurate paper database and graph visualization, discovery engine provides novel ways to collect and organize references. Manually editing bibliography files will finally become a history.
              </p>
            </v-flex>
          </v-layout>
        </v-container>
      </section>
      <section id="sign-up"
        class="py-5 mt-5 grey darken-3 white--text">
        <v-container grid-list-lg :px-5="$vuetify.breakpoint.smAndUp"
          :px-4="$vuetify.breakpoint.xsOnly">
          <h1 class="mt-2 pb-2 text--white title font-weight-light"
            style="line-height: 125% !important;">
            We are currently perfecting the graph visualization. Let's revolutionize literature study together.
          </h1>
          <v-form class="mt-2" v-model="isEmailValid"
            :action="`https://formspree.io/${toEmail}`" method="POST"
            @submit="submitEmail">
            <v-layout wrap>
              <v-flex xs12 sm10>
                <v-text-field dark outline hide-details single-line
                  v-model="email" name="email" label="Email"
                  autocomplete="email" :rules="emailRules"
                  placeholder="im@email.com" id="email"
                  @input="isSignUpAlertVisible = false" required>
                </v-text-field>
              </v-flex>
              <v-flex xs12 sm2>
                <v-btn large block type="submit" :disabled="!isEmailValid"
                  @click="submitEmail">
                  Submit
                </v-btn>
              </v-flex>
              <v-flex xs12>
                <v-alert v-if="isEmailValid" type="success" :value="isSignUpAlertVisible">
                  Thank you for signing up!
                </v-alert>
                <v-alert v-if="!isEmailValid" type="error" :value="isSignUpAlertVisible">
                  Please enter a valid email address.
                </v-alert>
              </v-flex>
            </v-layout>
          </v-form>
        </v-container>
      </section>
      <v-footer dark class="pa-3">
        <v-layout row justify-center>
          <span>Contact us:</span>
          &nbsp;
          <a ref="ourEmail" class="white--text"
            style="text-decoration: underline;" @click="copyEmail">
            {{ toEmail }}
          </a>
          <v-snackbar v-model="isCopyEmailSnackbarVisible" bottom :timeout="1000">
            Copied
          </v-snackbar>
        </v-layout>
      </v-footer>
    </v-content>
  </v-app>
</template>

<script>
import * as basicScroll from 'basicscroll'
import AuthMixin from '@/components/authmixin.js'
import ResponsiveTextLogo from './ResponsiveTextLogo.vue'

export default {
  name: 'LandingPage',
  components: {
    ResponsiveTextLogo
  },
  mixins: [ AuthMixin ],
  props: {
    value: Boolean
  },
  data () {
    return {
      email: '',
      isEmailValid: false,
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+/.test(v) || 'E-mail must be valid'
      ],
      bgRgbArr: [250, 250, 250],
      isSignUpAlertVisible: false,
      isCopyEmailSnackbarVisible: false
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    getImgUrl (img) {
      return require('../assets/' + img)
    },
    submitEmail () {
      this.isSignUpAlertVisible = true
      this.$ga.event('emails', 'sign up', this.email)
    },
    copyEmail () {
      navigator.clipboard.writeText(this.toEmail)
      this.isCopyEmailSnackbarVisible = true
    },
    fadeEdge (side) {
      const fadeLength = '8px'
      const [ r, g, b ] = this.bgRgbArr
      const rgbaTransparent = `rgba(${r}, ${g}, ${b}, 0.0)`
      const rgbaOpaque = `rgba(${r}, ${g}, ${b}, 1.0)`
      const style = {
        position: 'absolute',
        display: 'block',
        width: side === 'left' || side === 'right' ? fadeLength : '100%',
        height: side === 'top' || side === 'bottom' ? fadeLength : '100%',
        backgroundImage:
          `linear-gradient(to ${side}, ${rgbaTransparent} 0%, ${rgbaOpaque} 100%)`
      }
      style[side] = '0px'
      return style
    }
  },
  computed: {
    toEmail () {
      return process.env.LANDING_EMAIL
    },
    fadeLeft () {
      return this.fadeEdge('left')
    },
    fadeRight () {
      return this.fadeEdge('right')
    },
    fadeTop () {
      return this.fadeEdge('top')
    },
    fadeBottom () {
      return this.fadeEdge('bottom')
    }
  },
  mounted () {
    const bgRgbStr =
      getComputedStyle(document.querySelector('.application')).backgroundColor
    const rgbStr =
      bgRgbStr.substring(bgRgbStr.indexOf('(') + 1, bgRgbStr.indexOf(')'))
    const rgbStrs = rgbStr.split(',')
    this.bgRgbArr = rgbStrs.map(str => parseInt(str.trim()))
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

.page-title {
  cursor: pointer;
  font-family: 'Lora', serif;
  font-size: 26px;
}

.py-6 {
  padding-top: 80px;
  padding-bottom: 80px;
}

.container {
  max-width: 1185px;
  padding: 0px;
}

.action-buttons-container .v-btn {
  width: 130px;
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
