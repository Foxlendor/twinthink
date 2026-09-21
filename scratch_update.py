import glob
import os

files = glob.glob('apps/web/src/app/**/page.tsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    new_content = content.replace("background: '#FAFAFA'", "background: 'transparent'")
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print('Updated', f)
