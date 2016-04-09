materialAdmin
    .config(function ($stateProvider, $urlRouterProvider){
        $urlRouterProvider.otherwise("/home");


        $stateProvider
            .state ('home', {
                url: '/home',
                templateUrl: 'views/home.html'
            })
            .state('reader',{
                url:'/reader/:ip?:name',
                templateUrl:'views/reader.html'
            })
            .state('vis',{
                url:"/vis/:ip/:expId?:name",
                templateUrl:'views/visualization.html'
            })

            
    });
