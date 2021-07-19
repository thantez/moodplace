#!/bin/bash
java -jar gpx-animator-1.6.1-all.jar --forced-point-time-interval 100000 --input files/$1.gpx --output files/$1.mp4
