"""Hatchling build hook that pre-generates component .pyi stubs.

Gradio's ComponentMeta metaclass writes a ``<component>.pyi`` alongside each
component source file the first time the class is defined (i.e. when
``import gradio`` runs).  Those files are listed in .gitignore but declared
as hatchling *artifacts* so they get bundled into the wheel.

Without this hook the stubs only exist on a developer's machine *after* the
first import and would otherwise be absent from a freshly checked-out tree,
causing the wheel to ship without them and breaking mypy for end-users
(see https://github.com/gradio-app/gradio/issues/13781).
"""

from __future__ import annotations

import subprocess
import sys

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    PLUGIN_NAME = "custom"

    def initialize(self, version: str, build_data: dict) -> None:  # type: ignore[override]
        """Generate component .pyi stubs before the wheel is assembled."""
        subprocess.run(
            [sys.executable, "-c", "import gradio"],
            check=True,
            cwd=self.root,
        )
