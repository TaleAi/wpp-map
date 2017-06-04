//index.js
//获取应用实例
const app = getApp();
const bMap = require('../../libs/bmap-wx.min.js');
const MapData = app.AV.Object.extend('Map');
const MOVE_STATUS = {
    moving: 'moving',
    resting: 'resting'
}
const EARTH_RADIUS = 6378137;
Page({
    data: {
        markers: [],
        polyline: [{
            points: [],
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
        }],
        operation: {
            state: MOVE_STATUS.resting
        }
    },

    onLoad() {
        this.dist = 0;
        this.BDMap = new bMap.BMapWX({
            ak: 'nr9Kb7rdWdwqCDEoETRoN7bzGhIl0j8h'
        });
        this.mapCtx = wx.createMapContext('map');
        app.getUserInfo((user) => {
            this.user = user;
            wx.getStorage({
                key: 'trailData',
                success: (res) => {
                    console.log(res);
                    if (res.data) {
                        let data = res.data;
                        let points = data.polyline[0].points;
                        let point = points[points.length - 1];
                        let title = '';
                        this.BDMap.regeocoding({
                            location: point.latitude + ',' + point.longitude,
                            fail: (console.error),
                            success: (bdRes) => {
                                title = bdRes.wxMarkerData[0].address;
                                data.markers.push({
                                    latitude: point.latitude,
                                    longitude: point.longitude,
                                    title: title
                                })
                                this.saveTrail(data, data.dist);
                            }
                        });

                    }
                }
            })
        });

        app.getSystemInfo((systemInfo) => {
            let controls = this.data.controls;
            controls.push({
                id: 2,
                iconPath: '/images/play.png',
                position: {
                    left: systemInfo.windowWidth - 70,
                    top: 20,
                    width: 50,
                    height: 50
                },
                clickable: true
            });

            controls.push({
                id: 3,
                iconPath: '/images/history.png',
                position: {
                    left: systemInfo.windowWidth - 70,
                    top: systemInfo.windowHeight - 70,
                    width: 50,
                    height: 50
                },
                clickable: true
            });
            this.setData({
                controls: controls
            });
        })
    },

    onReady(){
        wx.getLocation({
            success: (res) => {
                this.setData({
                    latitude: res.latitude,
                    longitude: res.longitude
                })
            },
        });
    },

    onShow() {
         this.mapCtx.moveToLocation();
    },

    onUnload() {
        if (this.data.operation.state === MOVE_STATUS.moving) {
            this.stopMoving();
        }
    },
    
    createMarker(wxMarkerData, id) {
        //  根据百度地图返回的信息显示标记
        let marker = wxMarkerData;
        marker.title = wxMarkerData.address;
        marker.callout = {
            content: wxMarkerData.address,
            color: '#ffffff',
            borderRadius: 10,
            bgColor: '#000',
            padding: 5,
            display: 'ALWAYS'
        };
        marker.id = id;
        marker.width = 30;
        marker.height = 40;

        return marker;
    },

    startMoving() {
        let controls = this.data.controls;
        controls[1].iconPath = '/images/stop.png';
        this.setData({
            markers: [],
            polyline: [{
                points: [],
                color: "#FF0000DD",
                width: 2,
                dottedLine: true
            }],
            controls: controls,
            operation: { state: MOVE_STATUS.stopMoving }
        });

        this.BDMap.regeocoding({
            fail: (console.error),
            success: (data) => {
                this.getBaiduLocationSuccess(data);
                this.locationChange();
            }
        });
    },

    getBaiduLocationSuccess(data) {
        let marker = this.createMarker(data.wxMarkerData[0], 0);
        let polyline = this.data.polyline;
        polyline[0].points.push({
            longitude: marker.longitude,
            latitude: marker.latitude
        });
        let markers = this.data.markers;
        markers.push(marker);
        this.setData({
            markers: markers,
            polyline: polyline
        });

        if (this.data.operation.state === MOVE_STATUS.resting) {
            this.saveTrail(this.data, this.dist);
        }
    },

    stopMoving() {
        let controls = this.data.controls;
        controls[1].iconPath = '/images/play.png';
        this.setData({
            controls: controls,
            operation: { state: MOVE_STATUS.resting }
        });

        this.BDMap.regeocoding({
            fail: (console.error),
            success: this.getBaiduLocationSuccess
        });

        if (this.timer) {
            clearInterval(this.timer);
        }
    },

    saveTrail(data, dist) {

        let map = new MapData();
        map.set('startLocation', new app.AV.GeoPoint(data.markers[0].latitude, data.markers[0].longitude)); //根据开始点查询附近
        map.set('startPlaceName', data.markers[0].title);
        map.set('endLongitude', data.markers[1].longitude);
        map.set('endLatitude', data.markers[1].latitude);
        map.set('endPlaceName', data.markers[1].title);
        map.set('points', data.polyline[0].points);
        map.set('user', this.user.currentUser);
        map.set('distance', dist); // 单位为m
        map.save().then((map) => {
            this.dist = 0;
            wx.removeStorageSync('trailData');
        })
    },

    operationMap() {
        // 记录轨迹信息
        if (this.data.operation.state === MOVE_STATUS.resting) {
            this.startMoving();
        } else {
            this.stopMoving();
        }
    },

    locationChange() {
        this.timer = setInterval(() => {
            wx.getLocation({
                type: 'gcj02',
                success: (res) => {
                    let polyline = this.data.polyline;
                    const point = polyline[0].points[polyline[0].points.length - 1];
                    if (res.latitude === point.latitude && res.longitude === point.longitude) {
                        return;
                    } else {
                        polyline[0].points.push({
                            latitude: res.latitude,
                            longitude: res.longitude
                        });

                        this.dist += this.calcDist(point, { latitude: res.latitude, longitude: res.longitude });

                        this.setData({
                            polyline: polyline
                        });

                        wx.setStorage({
                            key: 'trailData',
                            data: {
                                markers: this.data.markers,
                                polyline: this.data.polyline,
                                dist: this.dist
                            }
                        })

                        this.mapCtx.moveToLocation();
                    }

                }
            })
        }, 5000)
    },

    control(e) {
        switch (e.controlId) {
            case 1:
                this.mapCtx.moveToLocation();
                break;
            case 2:
                this.operationMap();
                break;
            case 3:
                this.goHistory();
                break;
        }
    },

    calcDist(startPoint, endPoint) {
        // 计算距离
        let radLat1 = this.rad(startPoint.latitude);
        let radLat2 = this.rad(endPoint.latitude);

        let radLon1 = this.rad(startPoint.longitude);
        let radLon2 = this.rad(endPoint.longitude);

        if (radLat1 < 0) {
            radLat1 = Math.PI / 2 + Math.abs(radLat1); // south  
        }
        if (radLat1 > 0) {
            radLat1 = Math.PI / 2 - Math.abs(radLat1); // north  
        }
        if (radLon1 < 0) {
            radLon1 = Math.PI * 2 - Math.abs(radLon1); // west  
        }
        if (radLat2 < 0) {
            radLat2 = Math.PI / 2 + Math.abs(radLat2); // south  

        }
        if (radLat2 > 0) {
            radLat2 = Math.PI / 2 - Math.abs(radLat2); // north  

        }
        if (radLon2 < 0) {
            radLon2 = Math.PI * 2 - Math.abs(radLon2); // west
        }

        const x1 = EARTH_RADIUS * Math.cos(radLon1) * Math.sin(radLat1);
        const y1 = EARTH_RADIUS * Math.sin(radLon1) * Math.sin(radLat1);
        const z1 = EARTH_RADIUS * Math.cos(radLat1);

        const x2 = EARTH_RADIUS * Math.cos(radLon2) * Math.sin(radLat2);
        const y2 = EARTH_RADIUS * Math.sin(radLon2) * Math.sin(radLat2);
        const z2 = EARTH_RADIUS * Math.cos(radLat2);

        const d = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2));
        //余弦定理求夹角  
        const theta = Math.acos((EARTH_RADIUS * EARTH_RADIUS + EARTH_RADIUS * EARTH_RADIUS - d * d) / (2 * EARTH_RADIUS * EARTH_RADIUS));
        const dist = theta * EARTH_RADIUS;
        return dist;
    },

    rad(d) {
        // 转化为弧度
        return d * Math.PI / 180;
    },

    goHistory() {
        wx.navigateTo({
            url: '/pages/history/history'
        })
    },

    onShareAppMessage() {
        return {
            title: '朋友喊你来运动',
            path: '/pages/index/index',
            success: function (res) {
                wx.showToast({
                    title: '分享成功',
                    icon: 'success',
                    duration: 2000
                })
            },
            fail: function (res) {
                // 转发失败
            }
        }
    }
})