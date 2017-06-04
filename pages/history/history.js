import * as util from '../../utils/util'

const app = getApp();

// history.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    menuShow: false,
    trails: [],
    noMore: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loading = false;
    this.query = new app.AV.Query('Map');
    app.getUserInfo(user => {
      this.user = user;
      this.setData({
        avatarUrl: this.user.avatarUrl
      });
    })
  },

  onShow() {
    this.setData({
      trails: [],
      noMore:false
    });
    this.getHistoryData();
  },

  getHistoryData() {
    if (!this.loading && !this.data.noMore) {
      this.loading = true;
      this.query.equalTo('user', this.user.currentUser)
        .limit(20)
        .skip(this.data.trails.length)
        .descending('createdAt')
        .find()
        .then(trails => {
          if (trails.length > 0) {
            const pTrails = this.data.trails;
            trails.filter(trail => {
              trail.createdAt = util.formatTime(trail.createdAt);
              if (trail.attributes.distance > 100) {
                trail.attributes.dist = (trail.attributes.distance / 1000).toFixed(2) + 'km';
              } else {
                trail.attributes.dist = trail.attributes.distance.toFixed(2) + '米';
              }
              pTrails.push(trail);
            })
            this.setData({ trails: pTrails });
            this.loading = false;
            if (trails.length < 20) {
              this.setData({
                noMore: true
              })
            }
          } else {
            this.setData({
              noMore: true
            });
          }

        })
        .catch(() => {
          this.loading = false;
        });
    }

  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      trails: [],
      noMore:false
    });
    this.getHistoryData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.getHistoryData();
  },

  toggleMenu() {
    this.setData({
      menuShow: !this.data.menuShow
    })
  },

  back() {
    wx.navigateBack();
  },

  lookInMap(e) {
    wx.setStorageSync('trail', e.currentTarget.dataset.trail);
    wx.navigateTo({
      url: '/pages/trail/trail',
    });
  }
})