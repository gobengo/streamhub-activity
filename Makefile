lint: 
	find . -name "*.js" -print0 -maxdepth 1 | xargs -0 jslint
	find ./lib/ -name "*.js" -print0 | xargs -0 jslint
