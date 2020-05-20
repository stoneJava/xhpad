//实况 位势高度
define(['Controller/DataFormat', 'Function/numberFC/FloatSelector'], function(format, floatSelector) {
    
    var key;
    var legend;
    var item;

    var isOpen;
    var layerGH;     //图层
    var button;     //按钮
    // var select;     //选择框

    function init(){
        button = $('#live_hh');
        // select = $('#live_hh_select');
        button.click(function(){
            if(!isOpen) {
                open();
            } else {
                close();
            }
        });
        floatSelector.on('live_hh_select', 'click', function(){
            open();
        });

        // select.change(function(){
        //     if(isOpen) getData();
        // });

        timeBar.addCallback(function(){
            if(isOpen) getData();
        });

        key = 'live_h';
        // legend = '<p class="tuCengP">位势高度</p>' + 
        //         '<img src="img/legend/hh.png" alt="" />' +
        //         '<p>' +
        //             '<span>单位</span>' +
        //             '<span>hPa</span>' +
        //         '</p>';
        item = XHW.C.layerC.createItem('', '', function(){
            close();
        })
    }

    function getData(){    //TODO, 之后更改写法（传递时间，elem固定
        var level = floatSelector.getValue('live_hh_select');
       
        var time = XHW.silderTime;
      
        var param = '&level=' + level + '&year=' + time.year 
        + '&month=' + time.month + '&day=' + time.day +'&hour=' + time.hour;
        // http://weather.xinhong.net/stationdata_surf/isolinedata?level=0500&elem=HH&year=2019&month=01&day=07&hour=03
        XHW.C.http.http('/stationdata_surf/isolinedata', '?elem=HH' + param, function(data, time){
            time = format.jsonDate(time);
            item.htmlLayer = time[0] + ' ' + floatSelector.getValueDesc('live_hh_select') + '位势高度';
            XHW.C.layerC.updateLayerData(key, item);
           
            myData = data;
            drawGfsGH(data);
        },function(){
            remove();
        })
    }
    var myData;
    function drawGfsGH(data){
        //step1---------------等值线所在数组
        var feature = [];
        //step1.5-------------设置等值线默认颜色
        var DefaultColor = null;
        if($('#isolineConfigColorMode p .current').next().html() != '多色') {
            if($('#config_map p .current').next().html() == '影像图') {
                DefaultColor = "#2222FF";
            } else {
                DefaultColor = "#000000";
            }
        }
        let textColor = '#fff';
        //step2---------------循环遍历每一条线的数据
        for(var i = 0; i < data.lines.length; i++) {
            var lineData = data.lines[i];
            //step3----------------创建数组记录单条等值线的点
            if (!lineData)
                return;
            // var lnglats_src = [];
            // for(var j = 0; j < lineData.pointNum; j++) {
            //     lnglats_src.push(ol.proj.fromLonLat([lineData.lng[j], lineData.lat[j]]));
            // }
            // var lnglats = smoothLine(lnglats_src, 0.1, 0.5);

            var lnglats = smoothIsoline(lineData);
            if (!lnglats || lnglats.length <= 0)
                continue;
            var color = DefaultColor ? DefaultColor : "#" + ((1 << 24) + (lineData.lineColor.r << 16)     //颜色转为16进制
            + (lineData.lineColor.g << 8) + lineData.lineColor.b).toString(16).slice(1);
            let textBackgroundColor = color ;
            //step4-----------------创建地图线对象
            var line = new ol.Feature({
                geometry: new ol.geom.LineString(lnglats)
            });
            //step5------------------地图对象加入数组
            line.setStyle(buildIsolineStyle(lineData.val + '', lineData.lineWidth, color, textColor, textBackgroundColor));
            feature.push(line);
            // step6------------------添加文字
            // if(lnglats.length < 30) { // 点数量较少时不添加数字（防止地图标记过多/后续考虑更改为随层级变化
            //     continue;
            // }
            // if(lineData.isClose) {  //封闭线段 中部标注
            //     var markFeatu = new ol.Feature({
            //         geometry: new ol.geom.Point(lnglats_src[(lnglats_src.length * 3 / 4) >> 0])
            //     });
            //     let style = buildLineMarkTextStyle(lineData.val + '', textColor, textBackgroundColor, lnglats_src[lnglats_src.length * 3 / 4], lnglats_src[lnglats_src.length * 3 / 4 + 1]);
            //     markFeatu.setStyle(style);
            //     feature.push(markFeatu);
            // } else {                //未封闭线段  首尾标注
            //     var markFeatu1 = new ol.Feature({
            //         geometry: new ol.geom.Point(lnglats_src[0])
            //     });
            //     let style = buildLineMarkTextStyle(lineData.val + '', textColor, textBackgroundColor, lnglats_src[0], lnglats_src[1]);
            //     markFeatu1.setStyle(style);
            //     feature.push(markFeatu1);

            //     var markFeatu2 = new ol.Feature({
            //         geometry: new ol.geom.Point(lnglats_src[lnglats_src.length - 1])
            //     });
            //     style = buildLineMarkTextStyle(lineData.val + '', textColor, textBackgroundColor, lnglats_src[lnglats_src.length - 1], lnglats_src[lnglats_src.length - 2]);
            //     markFeatu2.setStyle(style);
            //     feature.push(markFeatu2);
            // } 
        }

        // var clusterSource = new ol.source.Cluster({
        //     distance: 20,
        //     source: new ol.source.Vector({
        //         features: feature
        //     })
        //   });
        //step7------------------将所有等值线加入同一个图层
        let source = new ol.source.Vector({
            features: feature
        });

        if (!layerGH) {
            layerGH = new ol.layer.Vector({
            
            });
            layerGH.setZIndex(5);
            layerGH.id = key;
        }
        layerGH.setSource(source);
        
        if ($.inArray(layerGH, XHW.map.getLayers().getArray()) == -1)
        XHW.map.addLayer(layerGH);
    }
    //===========================================================绘制结束

    function remove(){
        if(layerGH) {
            XHW.map.removeLayer(layerGH);
            layerGH = null;
        }
    }

    function open(){
        //---------添加图层控制
        item.htmlLayer = '位势高度';
        var b = XHW.C.layerC.addLayer(key, item);
        if(!b) {
            close();
            return;
        }
        //---------添加按钮选中样式
        button.parent().addClass('currenterJiBtn');
        button.prev().attr('src',button.prev().attr('mysrc'));
		XHW.C.layout.judgeWhetherSelect(button);
        // select.parent().css('display', 'inline-block'); //选中时展示层次选择框
        
        getData();
        isOpen = true;
    }

    function close(){
        //---------删除图层控制
        XHW.C.layerC.removeLayer(key);

        //---------取消按钮选中样式
        button.parent().removeClass('currenterJiBtn');
        button.prev().attr('src',button.prev().attr('mysrcpri'));
		XHW.C.layout.judgeWhetherSelect(button);
        // select.parent().hide();

        remove();
        isOpen = false;
    }

    function update(){
        if(!button.parent().hasClass('currenterJiBtn')) return;
        if(!layerGH) return;
        drawGfsGH(myData);
    }

    init();

    return {
        close: close,
        update: update,
    }
});