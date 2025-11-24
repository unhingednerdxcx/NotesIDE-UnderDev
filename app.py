## === IMPORTS === ##
import eel
from pathlib import Path
import os
import json
import subprocess
import serial.tools.list_ports
import shutil
from datetime import datetime
import tkinter as tk
from tkinter import filedialog
import traceback
import platform
import base64
from io import BytesIO
from PIL import Image
import signal
import sys

## === GLOABAL VARS === ##

FOLDER = os.getcwd()
NFOLDER = os.path.join(FOLDER, 'Notes')
DFOLDER = os.path.join(FOLDER, 'Dict')
WFOLDER = 'web'
IFOLDER = os.path.join(WFOLDER, 'img')
os.makedirs(IFOLDER, exist_ok=True)
root = tk.Tk()
root.withdraw()
status = False
available = False
i = 0

## === FUNCTIONS === ##

def open_native_folder_dialog():
    system = platform.system()  # 'Linux', 'Windows', 'Darwin' (macOS)
    
    # --- Linux ---
    if system == "Linux":
        # Try GNOME
        if shutil.which("zenity"):
            result = subprocess.run(['zenity', '--file-selection', '--directory'], capture_output=True, text=True)
        # Try KDE
        elif shutil.which("kdialog"):
            result = subprocess.run(['kdialog', '--getexistingdirectory'], capture_output=True, text=True)
        else:
            # fallback to Tkinter
            root = tk.Tk()
            root.withdraw()
            result_path = filedialog.askdirectory()
            root.destroy()
            return result_path if result_path else None

        if result.returncode == 0:
            return result.stdout.strip()
        return None

    # --- Windows ---
    elif system == "Windows":
        root = tk.Tk()
        root.withdraw()
        result_path = filedialog.askdirectory()
        root.destroy()
        return result_path if result_path else None

    # --- macOS ---
    elif system == "Darwin":
        try:
            # AppleScript for native folder selection
            script = 'POSIX path of (choose folder)'
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            # fallback to Tkinter
            root = tk.Tk()
            root.withdraw()
            result_path = filedialog.askdirectory()
            root.destroy()
            return result_path if result_path else None

    else:
        # Unknown system → fallback to Tkinter
        root = tk.Tk()
        root.withdraw()
        result_path = filedialog.askdirectory()
        root.destroy()
        return result_path if result_path else None

def open_native_file_dialog():
    system = platform.system()  # 'Linux', 'Windows', 'Darwin' (macOS)
    
    # --- Linux ---
    if system == "Linux":
        # Try GNOME
        if shutil.which("zenity"):
            result = subprocess.run(['zenity', '--file-selection'], capture_output=True, text=True)
        # Try KDE
        elif shutil.which("kdialog"):
            result = subprocess.run(['kdialog', '--getopenfilename'], capture_output=True, text=True)
        else:
            # fallback to Tkinter
            root = tk.Tk()
            root.withdraw()
            result_path = filedialog.askopenfilename()
            root.destroy()
            return result_path if result_path else None

        if result.returncode == 0:
            return result.stdout.strip()
        return None

    # --- Windows ---
    elif system == "Windows":
        root = tk.Tk()
        root.withdraw()
        result_path = filedialog.askopenfilename()
        root.destroy()
        return result_path if result_path else None

    # --- macOS ---
    elif system == "Darwin":
        try:
            # Try using AppleScript for native dialog
            script = 'POSIX path of (choose file)'
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            # fallback to Tkinter
            root = tk.Tk()
            root.withdraw()
            result_path = filedialog.askopenfilename()
            root.destroy()
            return result_path if result_path else None

    else:
        # Unknown system → fallback
        root = tk.Tk()
        root.withdraw()
        result_path = filedialog.askopenfilename()
        root.destroy()
        return result_path if result_path else None

def open_native_pic_file_dialog():
    system = platform.system()  # 'Linux', 'Windows', 'Darwin' (macOS)

    # --- Allowed extensions ---
    allowed_extensions = "*.jpeg *.jpg *.png *.bmp *.svg *.webp *.tiff *.tif"
    file_types = [("Image files", allowed_extensions)]

    # --- Linux ---
    if system == "Linux":
        # Try GNOME
        if shutil.which("zenity"):
            result = subprocess.run(
                ['zenity', '--file-selection', '--file-filter=Images | *.jpeg *.jpg *.png *.bmp *.svg *.webp *.tiff *.tif'],
                capture_output=True, text=True
            )
        # Try KDE
        elif shutil.which("kdialog"):
            result = subprocess.run(
                ['kdialog', '--getopenfilename', '.', '*.jpeg *.jpg *.png *.bmp *.svg *.webp *.tiff *.tif'],
                capture_output=True, text=True
            )
        else:
            # fallback to Tkinter
            root = tk.Tk()
            root.withdraw()
            result_path = filedialog.askopenfilename(filetypes=file_types)
            root.destroy()
            return result_path if result_path else None

        if result.returncode == 0:
            return result.stdout.strip()
        return None

    # --- Windows ---
    elif system == "Windows":
        root = tk.Tk()
        root.withdraw()
        result_path = filedialog.askopenfilename(filetypes=file_types)
        root.destroy()
        return result_path if result_path else None

    # --- macOS ---
    elif system == "Darwin":
        try:
            # AppleScript with filter not supported natively; filter manually after selection
            script = 'POSIX path of (choose file)'
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            if result.returncode == 0:
                path = result.stdout.strip()
                if path.lower().endswith(('.jpeg', '.jpg', '.png', '.bmp', '.svg', '.webp', '.tiff', '.tif')):
                    return path
                return None
        except:
            # fallback to Tkinter
            root = tk.Tk()
            root.withdraw()
            result_path = filedialog.askopenfilename(filetypes=file_types)
            root.destroy()
            return result_path if result_path else None

    else:
        # Unknown system → fallback
        root = tk.Tk()
        root.withdraw()
        result_path = filedialog.askopenfilename(filetypes=file_types)
        root.destroy()
        return result_path if result_path else None


def open_native_file_ports_dialog(multiple=False):
    """
    Opens a native file dialog for uploading files.
    
    Args:
        multiple (bool): If True, allow selecting multiple files.
        
    Returns:
        str or list[str] or None: Path(s) of selected file(s), or None if cancelled.
    """
    system = platform.system()  # 'Linux', 'Windows', 'Darwin' (macOS)

    # --- Linux ---
    if system == "Linux":
        # Try GNOME
        if shutil.which("zenity"):
            cmd = ['zenity', '--file-selection']
            if multiple:
                cmd.append('--multiple')
                cmd.append('--separator=:')  # custom separator
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                files = result.stdout.strip()
                return files.split(':') if multiple else files
            return None
        
        # Try KDE
        elif shutil.which("kdialog"):
            cmd = ['kdialog', '--getopenfilename']
            if multiple:
                cmd.append('--multiple')
                cmd.append('--separate-output')
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                files = result.stdout.strip()
                return files.split('\n') if multiple else files
            return None

    # --- Windows & macOS fallback (Tkinter) ---
    root = tk.Tk()
    root.withdraw()
    if multiple:
        result = filedialog.askopenfilenames()
        root.destroy()
        return list(result) if result else None
    else:
        result = filedialog.askopenfilename()
        root.destroy()
        return result if result else None

def image_to_base64(img: Image.Image) -> str:
    buffered = BytesIO()
    img_format = img.format if img.format else "PNG"  # Default to PNG
    img.save(buffered, format=img_format)
    img_bytes = buffered.getvalue()
    img_b64 = base64.b64encode(img_bytes).decode("utf-8")
    return f"data:image/{img_format.lower()};base64,{img_b64}"

def run_command(cmd):
    try:
        proc = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        for line in proc.stdout:
            eel.term_output(line)()
        for line in proc.stderr:
            eel.term_output(line)()
    except Exception as e:
        eel.term_output(f"Error: {e}\n")()

## === EXPOSED FUNCTIONS === ##

@eel.expose
def log(file, info, other):
    time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    global i
    i = i + 1
    msg = f" ${i} ${info}  ${other}"
    log_file_path = os.path.join(FOLDER, "notes.txt")
    with open(log_file_path, 'a', encoding='utf-8') as f:
        f.write(msg + "\n")

@eel.expose
def openFolder():
    try:
        file_path = open_native_folder_dialog()
        log("py", f"successfully gave {file_path}", "")
        return {"success": True, "path": file_path}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "message": e}

@eel.expose
def openFile():
    try:
        file_path = open_native_file_dialog()
        log("py", f"successfully gave {file_path}", "")
        return {"success": True, "path": file_path}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "message": e}

@eel.expose
def saveFile(content, file_path):
    try:
        with open(file_path, 'w') as f:
            f.write(content)
        return {"status": True}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"status": False, "message": str(e)}

@eel.expose
def listFiles(directory):
    try:
        objects = []
        for obj in os.listdir(directory):
            obj_path = os.path.join(directory, obj)
            if os.path.isfile(obj_path):
                objects.append({"name": obj, "type": "file", "path": obj_path})
            else:
                objects.append({"name": obj, "type": "folder", "path": obj_path})
        log('py', 'sent dicts', objects)
        return {"success": True, "files": objects} 
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "error": str(e)}

@eel.expose
def loadFile(file_path):
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        return {"success": True, "content": content}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "message": str(e)}

@eel.expose
def makeFile(path, fileName):
    try:
        file_path = os.path.join(path, fileName)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("Lets get to coding!")
            log('py', 'Made file at:', file_path)
        return {"success": True}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "message": str(e)}

@eel.expose
def makeNewFolder(path):
    try:
        folder_path = os.path.join(path, "NewFolder")
        os.makedirs(folder_path, exist_ok=True)
        return {"success": True}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "message": str(e)}

@eel.expose
def readFile(path, name):
    try:
        with open(path, 'r') as f:
            content = f.read()
            log('py', '', 'here')
            log('py', '', content)
        filename = os.path.basename(path) 
        ext = filename.split('.')[-1].lower()
        language = None
        match ext:
            case "py":
                language = "python"
            case "js":
                language = "javascript"
            case "ts":
                language = "typescript"
            case "java":
                language = "java"
            case "c":
                language = "c"
            case "cpp" | "cc" | "cxx":
                language = "cpp"
            case "html" | "htm":
                language = "html"
            case "css":
                language = "css"
            case "json":
                language = "json"
            case "rs":
                language = "rust"
            case "go":
                language = "go"
            case _:
                language = "text"
        log('py', 'extension', language)
        return {"success": True, "content": content, "language": language}
    except Exception as e:
        trace = traceback.format_exc()
        log('py', e, trace)
        return {"success": False, "error": str(e)}

@eel.expose
def renameFile(newName, oldPath, oldName=''):
    log('py', 'rename', 'Came')
    log('py', 'rename got', f"{newName}, {oldName}, {oldPath}")
    try:
        if oldPath == 'NFOLDER':
            global NFOLDER
            oldPath = NFOLDER
            log('py', 'dict', oldPath)
            newPath = os.path.join(oldPath, newName)
            oldPath = os.path.join(oldPath, oldName)
            log('py', '', newPath)
            os.rename(oldPath, newPath)
            return {"success": True, "newPath": newPath}
   
        elif oldPath == 'DFOLDER':
            global DFOLDER
            oldPath = DFOLDER
            log('py', 'dict', oldPath)
            newPath = os.path.join(oldPath, newName)
            oldPath = os.path.join(oldPath, oldName)
            log('py', '', newPath)
            os.rename(oldPath, newPath)
            return {"success": True, "newPath": newPath}

        directory = os.path.dirname(oldPath)
        newPath = os.path.join(directory, newName)
        log('py', '', newPath)
        os.rename(oldPath, newPath)
        log('py', '', newPath)
        return {"success": True, "newPath": newPath}
    except Exception as e:
        return {"success": False, "message": e}

@eel.expose
def deleteFile(path):
    try:
        os.remove(path)
        return {"success": True}
    except IsADirectoryError:
        shutil.rmtree(path)
        return {"success": True}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "message": e}

## == Notes == ##

@eel.expose
def newNote(fileName):
    if not fileName:
        return {"success": False, "error": "No file name provided"}

    try:
        file_path = os.path.join(NFOLDER, fileName)
        with open(file_path, 'w') as f:
            f.write(
                f"Write anything here then copy it to your many project (anytime, anywhere) "
                f"by writing\n notes.bring('{fileName}')"
            )
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        return {"success": True}




@eel.expose
def listNotes():
    notes = []
    try:
        for note in os.listdir(NFOLDER):
            path = os.path.join(NFOLDER, note)
            notes.append({"name": note, "path": path})
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "error": str(e)}
    return {"success": True, "Notes": notes}

@eel.expose
def saveNote(name, content):
    try:
        path = os.path.join(NFOLDER, name)
        with open(path, 'w') as f:
            f.write(content)
        return {"success": True}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "w": str(e)}

## == Dict == ##

@eel.expose
def listDict():
    dictionary = []
    try:
        for dic in os.listdir(DFOLDER):
            path = os.path.join(DFOLDER, dic)
            dictionary.append({"name": dic, "path": path})
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "error": str(e)}
    return {"success": True, "Dict": dictionary}

@eel.expose
def saveDict(name, content):
    try:
        path = os.path.join(DFOLDER, name)
        with open(path, 'w') as f:
            f.write(content)
        return {"success": True}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "w": str(e)}

@eel.expose
def newDict(fileName):
    try:
        file_path = os.path.join(DFOLDER, fileName)
        with open(file_path, 'w') as f:
            f.write(
                f"Use the syntax\n"
                f"function() | description\n"
                f"to make your dictionaries then insert them for example\n"
                f"print() | to output\n"
                f"then you can use notes.info({fileName}) to get the dicts"
            )
        return {"success": True}
    except Exception as e:
        log('py', 'at newDict', e)
        return {"success": False, "error": str(e)}

## == Circuit Viewer == ##

@eel.expose
def displayPic():
    for fn in os.listdir(IFOLDER):
        os.remove(os.path.join(IFOLDER, fn))

    filePath = open_native_pic_file_dialog()
    if not filePath:
        return {"success": False, "error": "Canceled request"}

    filename = os.path.basename(filePath)
    Ipath = os.path.join(IFOLDER, filename)
    shutil.copy(filePath, IFOLDER)
    log('py', Ipath, '\n')
    return {"success": True, "img": f"img/{filename}"}

## == Ports == ##

@eel.expose
def openUploadFile():
    try:
        file_path = open_native_file_ports_dialog()
        log("py", f"successfully gave {file_path}", "")
        return {"success": True, "path": file_path}
    except Exception as e:
        trace = traceback.format_exc()
        log("py", e, trace)
        return {"success": False, "e": str(e)}


## == Terminal == ##
def run_command(command):
    try:
        output = subprocess.check_output(command, shell=True, stderr=subprocess.STDOUT, text=True)
    except subprocess.CalledProcessError as e:
        output = e.output
    eel.term_output(output)  # send back to JS

@eel.expose
def execute_command(command):
    threading.Thread(target=run_command, args=(command,)).start()

## == Ports ==##

@eel.expose
def getPorts():
    active_ports = []
    ports = serial.tools.list_ports.comports()

    for port in ports:
        try:
            # Try to open and immediately close the port
            s = serial.Serial(port.device)
            s.close()
            active_ports.append(port.device)
        except (OSError, serial.SerialException):
            # Can't open → probably inactive or in use
            pass
    return {"success": True, "ports": active_ports}

## == Settings == ##

@eel.expose
def jsonmanager(proc, grp="", subgrp="", setto=""):
    try:
        with open("data/settings.json", 'r') as f:   
            data = json.load(f)
        if proc == 'g':
            value = data[grp][subgrp]
            return value
        elif proc == 's':
            data[grp][subgrp] = setto
            with open("data/settings.json", 'w') as f:
                json.dump(data, f, indent= 4)
            return {"success": True}
        elif proc == 'ga':
            return data
    except Exception as e:
        log('py', 'at settings', e)
        return {"success": False, "e": str(e)}

@eel.expose
def getThemes():
    try:
        with open("data/data.json", 'r') as f:
            data = json.load(f)
        return data
    except:
        log('py', '', 'Error')





# Start the Eel application
if __name__ == "__main__":
    eel.init(WFOLDER)
    eel.start('index.html', size=(1200, 800), port=0)




