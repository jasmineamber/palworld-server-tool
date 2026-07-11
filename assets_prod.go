//go:build assets

package main

import "embed"

//go:embed assets/*
var assets embed.FS

//go:embed index.html
var indexHTML embed.FS

//go:embed favicon.ico
var favicon []byte

//go:embed map/*
var mapTiles embed.FS

const (
	assetsRoot    = "assets"
	indexHTMLPath = "index.html"
	mapRoot       = "map"
)
