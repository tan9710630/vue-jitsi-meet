<template>
  <div class="client_form">
    <video class="video_form" ref="video_form" autoplay="1"></video>
    <audio autoplay="1" :muted="beMute" ref="audio_form"></audio>
    <a>{{ name }}</a>
  </div>
</template>

<script>
export default {
  props: {
    videoTrack: {
      type: Object,
      require: true,
      default() {
        return {};
      },
    },
    audioTrack: {
      type: Object,
      require: true,
      default() {
        return {};
      },
    },
    name: {
      type: String,
      require: true,
      default() {
        return "无";
      },
    },
    beMute: {
      type: Boolean,
      require: true,
      default() {
        return false;
      },
    },
  },
  watch: {
    // 由于对已有的客户端连接在客户端键入后可能发生音视频流的变更，所以需要监听变换
    videoTrack(val) {
      val.attach(this.$refs.video_form);
    },
    audioTrack(val) {
      val.attach(this.$refs.audio_form);
    },
  },
  mounted() {
    // 一旦传入便将音视频流播放出来，这里的流可能无效但是绝对不为空
    this.videoTrack.attach(this.$refs.video_form);
    this.audioTrack.attach(this.$refs.audio_form);
  },
};
</script>

<style>
.client_form {
  width: 400px;
  height: 300px;
}
.video_form {
  width: 400px;
  height: 225px;
}
</style>