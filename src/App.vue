<template>
  <div id="app">
    <h1>Jitsi WebRTC Demo</h1>
    <a v-if="!beVideoStart">输入名称：</a>
    <input v-if="!beVideoStart" type="text" v-model="name" />
    <button v-if="!beVideoStart" @click="StartVideo">开始捕获</button>
    <br />
    <button v-if="!beInRoom && beVideoStart" @click="Connect">加入会议</button>
    <button v-if="beInRoom" @click="Disconnect">离开会议</button>
    <div class="video_container">
      <ClientForm
        v-if="selfMedia.videoTrack != undefined"
        :videoTrack="selfMedia.videoTrack"
        :audioTrack="selfMedia.audioTrack"
        :name="selfMedia.name"
        :beMute="true"
      />
      <ClientForm
        v-for="item in meet.clients"
        :key="item.id"
        :videoTrack="item.videoTrack"
        :audioTrack="item.audioTrack"
        :name="item.name"
        class="remote_client"
      />
    </div>
  </div>
</template>

<script>
import { JitsiMeet } from "@/jitsi_meet/jitsi_meet";
import ClientClient from "@/jitsi_meet/client.vue";
export default {
  name: "App",
  components: { ClientForm: ClientClient },
  data() {
    return {
      name: "默认名字",
      meet: {
        clients: [],
      },
      selfMedia: {
        videoTrack: undefined,
        audioTrack: undefined,
        name: undefined,
      },
      beVideoStart: false,
      beInRoom: false,
    };
  },
  methods: {
    StartVideo() {
      // 构造工具类
      this.meet = new JitsiMeet(
        //这里是服务端的XMPP地址
        "wss://jitsi.xunshi.com/xmpp-websocket",
        this.name
      );
      // 初始化本地媒体流
      this.initLocalMedia();
      // 添加对远程媒体流变化的监听
      // 这里由于VUE响应问题所以直接刷新data，不在乎什么性能
      this.meet.onClientsUpdate = () => {
        this.$forceUpdate();
      };
      this.beVideoStart = true;
    },
    Connect() {
      // 加入名称为xxx的房间（这一步会创建连接与房间对象）
      this.meet.joinRoom("xxxx");
      this.beInRoom = true;
    },
    Disconnect() {
      // 离开房间（这一步会断开连接）
      this.meet.leveRoom();
      this.beInRoom = false;
    },
    async initLocalMedia() {
      // 初始化本地媒体流
      this.selfMedia = await this.meet.initLocalMedia();
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.video_container {
  width: 100%;
}
.remote_client {
  float: left;
}
</style>
