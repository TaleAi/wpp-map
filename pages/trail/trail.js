// trail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const trail = wx.getStorageSync('trail');
    this.setData({
      latitude: trail.startLocation.latitude,
      longitude: trail.startLocation.longitude,
      markers: [{
        latitude: trail.startLocation.latitude,
        longitude: trail.startLocation.longitude,
        callout: {
          content: trail.startPlaceName,
          color: '#ffffff',
          borderRadius: 10,
          bgColor: '#000',
          padding: 5,
          display: 'ALWAYS'
        }
      },
      {
        latitude: trail.endLatitude,
        longitude: trail.endLongitude,
        callout: {
          content: trail.endPlaceName,
          color: '#ffffff',
          borderRadius: 10,
          bgColor: '#000',
          padding: 5,
          display: 'ALWAYS'
        }
      }
      ],
      polyline: [{
        points: trail.points,
        color: "#FF0000DD",
        width: 2,
        dottedLine: true
      }],
      controls: [{
        id: 1,
        iconPath: '/images/location-control.png',
        position: {
          left: 20,
          top: 20,
          width: 50,
          height: 50
        },
        clickable: true
      }]
    })
  },

  back(){
    wx.navigateBack();
  },

  onHide(){
    wx.removeStorageSync('trail');
  },

  onUnload(){
    wx.removeStorageSync('trail');
  }
})