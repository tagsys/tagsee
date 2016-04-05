materialAdmin
    .config(function ($stateProvider, $urlRouterProvider){


        $stateProvider
            .state ('home', {
                url: '/home',
                templateUrl: 'views/home.html'
            })
            .state('reader',{
                url:'/reader/:ip?:name',
                templateUrl:'views/reader.html'
            })
            .state('test',{
                url:"/test",
                templateUrl:'views/test.html'
            });

        $urlRouterProvider.otherwise("/home");
    });
