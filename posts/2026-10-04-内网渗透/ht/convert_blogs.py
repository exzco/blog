import os
import json
import sys

def convert_to_jsonl(input_dir, output_file):
    count = 0
    with open(output_file, 'w', encoding='utf-8') as f_out:
        for root, dirs, files in os.walk(input_dir):
            for file in files:
                if file.endswith('.md'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f_in:
                            content = f_in.read()
                        
                        rel_path = os.path.relpath(file_path, input_dir)
                        data = {
                            "source": rel_path,
                            "content": content
                        }
                        f_out.write(json.dumps(data, ensure_ascii=False) + '\n')
                        count += 1
                    except Exception as e:
                        pass
    print(f"Processed {count} files.")

if __name__ == "__main__":
    convert_to_jsonl("blogs", "/tmp/blogs_kb.jsonl")
