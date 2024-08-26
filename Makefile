# Makefile

# ビルドとデプロイを行うターゲット
deploy: build deploy-firebase

# ビルドを実行するターゲット
build:
	npm run build

# Firebaseへのデプロイを実行するターゲット
deploy-firebase:
	firebase deploy

# ターゲット: dev
dev:
	npm run dev

# ターゲット: lint
lint:
	npm run lint

# ターゲット: serve
serve:
	npm run serve

# ターゲット: test
test:
	npm run test