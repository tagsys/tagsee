// =========================================================================
// Visulization controller
// =========================================================================
materialAdmin.controller('visualController', function ($scope, $state, $stateParams, $timeout, $filter,
                                                       dataService, ngTableParams, highchartsNG) {

    $scope.expId = $stateParams.expId;
    $scope.ip = $stateParams.ip;
    $scope.name = $stateParams.name;

    $scope.exp = null;
    $scope.total = 0;
    $scope.filters = [];
    $scope.widgets = {table:true, filter:true, rssiChart:true, phaseChart:true, dopplerChart:true};
    $scope.defaultPropertyNames = ['epc', 'antenna', 'channel', 'phase', 'rssi', 'doppler', 'firstSeenTime', 'lastSeenTime', 'timestamp'];
    $scope.defaultVisibleProperties = {
        'epc': true, 'antenna': true, 'channel': true, 'doppler': false, 'phase': true, 'rssi': true,
        'firstSeenTime': true, 'lastSeenTime': false, 'timestamp': true
    };


    $scope.readTablePrams = new ngTableParams({page: 1, count: 10, sorting: {name: 'desc'}},
        {
            getData: function ($defer, params) {

                if ($scope.exp && $scope.exp.readings && !$scope.exp.isReading) {


                    var readings = _.filter($scope.exp.readings, function (reading) {
                        return $scope.exp.filters[reading.epc].checked;
                    });

                    var orderedData = params.sorting() ? $filter('orderBy')(readings, params.orderBy()) : readings;
                    $scope.total = orderedData.length;
                    params.total(orderedData.length);
                    $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));

                }

                return null;
            }
        });


    $scope.refresh = function () {
        $scope.filters = $scope.exp.filters;
        $scope.readTablePrams.reload();
    }


    var addReading = function(data, property, reading){
        var value = 0.0;
        if(property=='phase'){
            value = (4096-reading.phase)/4096*2*Math.PI;
        }else if(property=='sin-phase'){
            value = Math.sin((4096-reading.phase)/4096*2*Math.PI);
        }else if(property == "rssi"){
            value =  reading.rssi;
        }else if(property == 'doppler'){
            value = reading.doppler;
        }

        var time = reading.firstSeenTime - $scope.exp.readings[0].firstSeenTime;

        if(data.length>1000){
            data.shift();
        }

        data.push([time, value]);
    }


    var updateSeries = function(series, property){

        //check the changes of filters to add or remove series
        var epcs = Object.keys($scope.exp.filters);
        for(var i=0;i<epcs.length;i++){
            var epc = epcs[i];
            var checked = $scope.exp.filters[epc].checked;
            var found = false;
            for(var j=0;j<series.length;j++){
                if(series[j].name===epc){
                    found = true;
                    break;
                }
            }
            if(checked && !found){
                series.push({name:epcs[i],lastScannedIndex:0,data:[]});
            }else if(!checked && found){
                series.splice(j,1);
            }

        }


        //check all series to update the scanning
        for(var i=0;i<series.length;i++){
            var s = series[i];
            var readings = $scope.exp.readings;
            for(var j=s.lastScannedIndex;j<readings.length;j++){
                if(readings[j].epc == s.name) {
                    addReading(s.data, property, readings[j]);
                }
            }
            s.lastScannedIndex = readings.length;
        }

    }

    var updateCharts = function(){

        updateSeries($scope.rssiChartConfig.series,'rssi');

        updateSeries($scope.phaseChartConfig.series, 'phase');

        updateSeries($scope.dopplerChartConfig.series, 'doppler');

        $scope.$apply();

        setTimeout(function(){
            updateCharts();

        },1000);
    }




    dataService.load(function (expCollection) {

        $scope.exp = dataService.get($scope.expId);

        highchartsNG.ready(function(){

            $scope.phaseChartConfig = {
                options:{
                    chart: {
                        zoomType: 'x'
                    },
                    title: {
                        text: ''
                    },
                    xAxis: {
                        type: 'linear'
                    },
                    yAxis: {
                        title: {
                            text: 'Radians'
                        }
                    },
                    legend: {
                        enabled: true
                    },
                    plotOptions:{
                        marker:{
                            radius:5
                        }
                    }
                },
                series: []
            }
            $scope.rssiChartConfig = {
                options:{
                    chart: {
                        zoomType: 'x'
                    },
                    title: {
                        text: ''
                    },
                    xAxis: {
                        type: 'linear'
                    },
                    yAxis: {
                        title: {
                            text: 'RSS'
                        }
                    },
                    legend: {
                        enabled: true
                    },
                },
                series: []
            }
            $scope.dopplerChartConfig = {
                options:{
                    chart: {
                        zoomType: 'x'
                    },
                    title: {
                        text: ''
                    },
                    xAxis: {
                        type: 'linear'
                    },
                    yAxis: {
                        title: {
                            text: ''
                        }
                    },
                    legend: {
                        enabled: true
                    },
                },
                series: []
            }

            /**
             * Refreshing the three charts regularly.
             */
            setTimeout(function(){
                updateCharts();

            },1000);

        },this);

        $scope.refresh();

    });

    $scope.checkFilter = function (epc,checked) {

        dataService.save();

        $scope.refresh();

    }

    $scope.isPropertyVisible = function (property) {
        if (!$scope.exp) return;

        if (!$scope.exp.visibleProperties) {
            $scope.exp.visibleProperties = $scope.defaultVisibleProperties;
        }
        return $scope.exp.visibleProperties[property];
    }

    $scope.changeProperty = function () {
        if ($scope.exp) {
            dataService.update($scope.exp);
        }
    }

    $scope.terminate = function(){

        swal({   title: "Are you sure?",
            text: "You will forcedly terminate the reading! This action will not seed close command to reader.",
            type: "warning",   showCancelButton: true,
            confirmButtonColor: "#DD6B55",   confirmButtonText: "Yes",
            cancelButtonText: "No",   closeOnConfirm: true,   closeOnCancel: true },
            function(isConfirm){
                if (isConfirm) {
                    $scope.exp.isReading = false;
                    dataService.save();
                } else {
                    //ignore it.
                }
            });

    }

    $scope.download = function () {

        var data = "";
        if ($scope.exp && $scope.exp.readings) {

            var filtering = {}
            for (var i = 0; i < $scope.filters.length; i++) {
                filtering[$scope.filters[i].epc] = $scope.filters[i].checked;
            }
            var readings = _.filter($scope.exp.readings, function (reading) {
                return filtering[reading.epc];
            });


            for (var i = 0; i < readings.length; i++) {
                data += readings[i].epc + ",";

                if ($scope.exp.visibleProperties['antenna']) {
                    data += readings[i].antenna + ",";
                }
                if ($scope.exp.visibleProperties['channel']) {
                    data += readings[i].channel + ",";
                }
                if ($scope.exp.visibleProperties['phase']) {
                    data += readings[i].phase + ",";
                }
                if ($scope.exp.visibleProperties['rssi']) {
                    data += readings[i].rssi + ",";
                }
                if ($scope.exp.visibleProperties['doppler']) {
                    data += readings[i].doppler + ",";
                }
                if ($scope.exp.visibleProperties['peekRssi']) {
                    data += readings[i].peekRssi + ",";
                }
                if ($scope.exp.visibleProperties['firstSeenTime']) {
                    data += readings[i].firstSeenTime + ",";
                }
                if ($scope.exp.visibleProperties['lastSeenTime']) {
                    data += readings[i].lastSeenTime + ",";
                }
                if ($scope.exp.visibleProperties['timestamp']) {
                    data += readings[i].lastSeenTime + ",";
                }
                data += "\n";
            }

            swal({  title:"Download Experiment Results",
                imageUrl: "img/download.png",
                text: "Please click <span id='download-csv' style='color:#F8BB86'></span> or " +
                "<span id='download-txt' style='color:#F8BB86'></span>",
                html: true });

            console.log(data);
            var a = document.createElement("a");
            a.href = "data:"+ "text/csv;charset=utf-8,"+ encodeURIComponent(data);
            a.target = "_blank";
            a.download = $scope.exp.marker+".csv";
            a.innerHTML = $scope.exp.marker+".csv";
            document.getElementById('download-csv').appendChild(a);


            var a = document.createElement("a");
            a.href = "data:"+ "text/plain;charset=utf-8,"+ encodeURIComponent(data);
            a.target = "_blank";
            a.innerHTML = $scope.exp.marker+".txt";
            document.getElementById('download-txt').appendChild(a);

        }

    }

    $scope.toggle = function(widgetName){
        $scope.widgets[widgetName] = !$scope.widgets[widgetName];
    }



})