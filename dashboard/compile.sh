#!/usr/bin/env bash


bower install ./public/vendors/

mvn install:install-file -Dfile=./lib/ltkjava-10.16.0.240-with-dependencies.jar  -DgroupId=org.llrp -DartifactId=ltkjava -Dversion=10.16.0.240 -Dpackaging=jar

mvn install