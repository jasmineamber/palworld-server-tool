//go:build !assets

package main

import "embed"

//go:embed internal/embedfallback/assets/*
var assets embed.FS

//go:embed internal/embedfallback/index.html
var indexHTML embed.FS

//go:embed internal/embedfallback/favicon.ico
var favicon []byte

//go:embed internal/embedfallback/map/*
var mapTiles embed.FS

const (
	assetsRoot    = "internal/embedfallback/assets"
	indexHTMLPath = "internal/embedfallback/index.html"
	mapRoot       = "internal/embedfallback/map"
)
