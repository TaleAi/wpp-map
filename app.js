//app.js
import HttpService from 'utils/HttpService';
const AV = require('./libs/av-weapp-min.js');

App({
    onLaunch() {
        AV.init({
            appId: 'LLSUer2RySkF8sMgj3PpqG32-gzGzoHsz',
            appKey: 'tJHOM56LH8kibUAr6ekM3LUi',
        });

    },
    getUserInfo(cb) {
        if (this.globalData.userInfo) {
            typeof cb == "function" && cb(this.globalData.userInfo)
        } else {
            //调用登录接口
            AV.User.loginWithWeapp().then(user => {
                const currentUser = AV.User.current();

                wx.getUserInfo({
                    success: ({ userInfo }) => {
                        // 更新当前用户的信息
                        currentUser.set(userInfo).save().then(user => {
                            // 成功，此时可在控制台中看到更新后的用户信息
                            this.globalData.userInfo = user.toJSON();
                            cb(this.globalData.userInfo);
                        }).catch(console.error);
                    }
                });
            }).catch(() => {
                wx.showToast({
                    title: '获取用户信息失败',
                    icon: 'fail',
                    duration: 2000
                })
            });
        }
    },
    getSystemInfo: function(cb) {
        if (this.globalData.systemInfo) {
            typeof cb == "function" && cb(this.globalData.systemInfo)
        } else {
            wx.getSystemInfo({
                success: (res) => {
                    this.globalData.systemInfo = res;
                    cb(this.globalData.systemInfo);
                }
            })
        }
    },
    globalData: {
        userInfo: null,
        systemInfo: null
    },
    HttpService: new HttpService,
    AV: AV
})