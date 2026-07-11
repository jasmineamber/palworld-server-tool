package source

import (
	"errors"
	"io/fs"
	"path/filepath"
	"strings"
	"testing"
)

func TestCopyFromLocalReturnsSourceAccessError(t *testing.T) {
	missing := filepath.Join(t.TempDir(), "missing")

	_, err := CopyFromLocal(missing, "decode")
	if err == nil {
		t.Fatal("expected an error for a missing save source")
	}
	if !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("expected a not-exist error, got %v", err)
	}
	if !strings.Contains(err.Error(), "cannot access save source") {
		t.Fatalf("expected an actionable source error, got %v", err)
	}
}
