import JitsiMeetJS from "@lyno/lib-jitsi-meet/lib-jitsi-meet.min.js";

export class JitsiMeet {
    // 默认配置，这里至于服务端配置有关与部署URL无关，固定不变
    options = {
        hosts: {
            domain: "meet.jitsi",
            muc: "muc.meet.jitsi",
        },
    };
    connection = null;
    roomName = "default_root_name";
    userName = "default_user_name";
    password = undefined;
    room = null;
    // 这里是所有客户端，包含音视频流与客户端名称
    clients = {};
    // 这里是本地音视频流与名称
    selfMedia = {};


    constructor(serviceUrl, userName) {
        this.userName = userName === undefined ? this.userName : userName;
        // 初始化库
        JitsiMeetJS.init();
        // 设置日志级别，如果是INFO控制台东西会很多
        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
        // 配置里面只有serviceUrl需要指定
        this.options.serviceUrl = serviceUrl
    }

    initLocalMedia = () => {
        // 由于创建createLocalTracks本来就是异步函数，所以初始化就这样干
        return new Promise((resolve) => {
            // 创建本地音视频流
            JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] }).then((tracks) => {
                // 获得流数组之后构建selfMedia属性
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i].type === "video") {
                        this.selfMedia.videoTrack = tracks[i];
                    }
                    if (tracks[i].type === "audio") {
                        this.selfMedia.audioTrack = tracks[i];
                    }
                    this.selfMedia.name = this.userName;
                }
                // 将selfMedia返回
                resolve(this.selfMedia);
            });
        })
    }

    joinRoom(roomName, password) {
        // 创建连接对象
        this.connection = new JitsiMeetJS.JitsiConnection(null, null, this.options);
        // 当连接成功的时候绑定到函数onConnectionSuccess上
        this.connection.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
            this.onConnectionSuccess);
        // 工具内一些全局参数
        this.roomName = roomName === undefined ? this.roomName : roomName;
        this.password = password;
        // 连接到服务器
        this.connection.connect();
    }
    leveRoom = () => {
        // 立刻房间
        this.room.leave();
        // 断开连接（PS：这里应该在连接搞个断开的回调，将老连接监听给取消掉）
        this.connection.disconnect();
        // 移除所有参与人
        this.clients = {};
        // 发送更新VUE数据指令
        this.onClientsUpdate();
    }

    onClientsUpdate = () => {

    }
    // 一旦连接到服务器之后便调用
    onConnectionSuccess = () => {
        // 创建一个房间，如果房间名相同则会所有人进入同一个房间
        this.room = this.connection.initJitsiConference(this.roomName, { connection: this.connection });
        // 当房间内被添加一个媒体流时（可能是音频也可能是视频）
        this.room.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track) => {
            if (track.isLocal()) {
                return;
            }
            // 这个participantId可以理解为客户端的ID，对一个客户端而言是唯一的
            let participantId = track.getParticipantId();
            if (this.clients[participantId] === undefined) {
                this.clients[participantId] = {};
            }
            // 视频流
            if (track.type === "video") {
                this.clients[participantId].videoTrack = track;
            }
            // 音频流
            if (track.type === "audio") {
                this.clients[participantId].audioTrack = track;
            }
            // 这里判断是否需要更新，一旦一个客户端自身的音视频流不完整则不更新
            let needUpdate = true;
            for (let key in this.clients) {
                if (this.clients[key].videoTrack && this.clients[key].audioTrack) {
                    continue;
                }
                needUpdate = false;
            }
            if (needUpdate) {
                // 这里是获取客户端的名称，只能说藏的有点深
                this.clients[participantId].name = this.room.room.members[`xxxx@muc.meet.jitsi/${participantId}`].nick;
                this.onClientsUpdate();
            }
        })
        // 有客户端断开连接了
        this.room.on(JitsiMeetJS.events.conference.USER_LEFT, (id) => {
            // 删除对应的客户端，VUE会移除对应的音视频流
            delete this.clients[id];
            this.onClientsUpdate();
        })
        // 设置自己的名字
        this.room.setDisplayName(this.userName);
        // 将本地音视频流添加房间之中
        if (this.selfMedia.videoTrack) {
            this.room.addTrack(this.selfMedia.videoTrack);
        }
        if (this.selfMedia.audioTrack) {
            this.room.addTrack(this.selfMedia.audioTrack);
        }
        // 加入房间
        this.room.join(this.password);
    }
}

