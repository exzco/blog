import os
import json

def convert_to_jsonl(input_dir, output_file):
    with open(output_file, 'w', encoding='utf-8') as f_out:
        for root, dirs, files in os.walk(input_dir):
            for file in files:
                if file.endswith('.md'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f_in:
                            content = f_in.read()
                        
                        # Generate a relative path for the source metadata
                        rel_path = os.path.relpath(file_path, input_dir)
                        
                        # Create JSON object
                        data = {
                            "source": rel_path,
                            "content": content
                        }
                        
                        # Write JSON string as a single line
                        f_out.write(json.dumps(data, ensure_ascii=False) + '\n')
                        
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_directory = os.path.join(current_dir, "hacktricks")
    output_jsonl = os.path.join(current_dir, "hacktricks_kb.jsonl")
    
    print(f"Starting conversion...")
    print(f"Input directory: {input_directory}")
    print(f"Output file: {output_jsonl}")
    
    convert_to_jsonl(input_directory, output_jsonl)
    print("Conversion complete!")
