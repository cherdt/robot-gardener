#!/bin/bash

IS_FAILED=0

echo "Running jshint..."
if jshint js/garden.js js/parseqs.js js/shuffle.js js/start.js
then
	echo "jshint passed!"
else
	echo "jshint failed!"
	IS_FAILED=1
fi
echo

echo "Running qunit tests..."
if qunit
then
	echo "qunit tests passed"
else
	echo "qunit tests failed"
	IS_FAILED=1
fi
echo

exit $IS_FAILED