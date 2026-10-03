"""
TwinThink Portable .twin Bundle Packager & Importer (v0.1)
Handles deterministic packaging and unpacking of .twin archives.
"""

import os
import io
import json
import zipfile
from pathlib import Path
from typing import Dict, Any, Optional

from .schema import TwinDocument
from .factory.engine import TwinFactoryEngine

class TwinBundleManager:
    @staticmethod
    def pack(
        twin_doc: TwinDocument,
        output_file: str,
        files_dict: Optional[Dict[str, bytes]] = None
    ) -> str:
        """
        Packs a TwinDocument and supporting directory tree into a .twin (ZIP) container.
        """
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            # 1. Write twin.json master graph
            doc_json = twin_doc.model_dump_json(by_alias=True, indent=2)
            zf.writestr("twin.json", doc_json)

            # 2. Write README.md summary
            readme_text = f"""# {twin_doc.identity.title}
> {twin_doc.identity.subtitle}

**Twin ID**: `{twin_doc.identity.twin_id}`  
**Version**: `{twin_doc.identity.version}`  
**Author**: {twin_doc.identity.author.name} (@{twin_doc.identity.author.handle})  
**License**: `{twin_doc.identity.license}`  

---

## Reality State
- **Composite Reality Score**: `{int(twin_doc.reality_state.composite_score * 100)}%`
- **Structure**: `{twin_doc.reality_state.derived_dimensions['structure'].status}` ({twin_doc.reality_state.derived_dimensions['structure'].reason})
- **Thermal**: `{twin_doc.reality_state.derived_dimensions['thermal'].status}` ({twin_doc.reality_state.derived_dimensions['thermal'].reason})
- **Materials**: `{twin_doc.reality_state.derived_dimensions['materials'].status}` ({twin_doc.reality_state.derived_dimensions['materials'].reason})
- **Safety**: `{twin_doc.reality_state.derived_dimensions['safety'].status}` ({twin_doc.reality_state.derived_dimensions['safety'].reason})
- **Manufacturing**: `{twin_doc.reality_state.derived_dimensions['manufacturing'].status}` ({twin_doc.reality_state.derived_dimensions['manufacturing'].reason})

---

Compiled with TwinThink Idea Reality Engine v0.1
https://twinth.ink
"""
            zf.writestr("README.md", readme_text)

            # 3. Include all supporting asset and telemetry files
            if files_dict:
                for rel_path, data in files_dict.items():
                    if rel_path not in ["twin.json", "README.md"]:
                        zf.writestr(rel_path, data)

        return str(output_path.resolve())

    @staticmethod
    def unpack(bundle_path: str) -> TwinDocument:
        """
        Unpacks a .twin archive and returns a validated TwinDocument.
        """
        with zipfile.ZipFile(bundle_path, 'r') as zf:
            if "twin.json" in zf.namelist():
                raw_json = zf.read("twin.json").decode('utf-8')
                doc_dict = json.loads(raw_json)
                return TwinDocument.model_validate(doc_dict)
            else:
                # Fallback: Ingest raw files with factory engine
                file_map = {name: zf.read(name) for name in zf.namelist() if not name.endswith('/')}
                return TwinFactoryEngine.process_bundle(file_map)
