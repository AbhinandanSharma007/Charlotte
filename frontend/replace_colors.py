import os
import re

directory = 'src'

replacements = {
    r'text-white': 'text-theme-text',
    r'text-gray-200': 'text-theme-text',
    r'text-gray-300': 'text-theme-muted',
    r'text-gray-400': 'text-theme-muted',
    r'text-gray-500': 'text-theme-muted',
    r'bg-white/5': 'bg-grid-panelHover',
    r'bg-white/10': 'bg-grid-panelHover',
    r'bg-white/\[0\.05\]': 'bg-grid-panelHover',
    r'bg-black/40': 'bg-grid-dark',
    r'border-gray-700': 'border-grid-border',
    r'border-gray-800': 'border-grid-border',
    r'bg-gray-800': 'bg-grid-panelHover',
    r'text-slate-400': 'text-theme-muted',
}

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = content
            for old, new in replacements.items():
                new_content = re.sub(old, new, new_content)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
