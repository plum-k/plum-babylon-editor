export function useFileInput() {

    const form = document.createElement('form');
    form.style.display = 'none';
    document.body.appendChild(form);

    const fileInput = document.createElement('input');
    fileInput.multiple = true;
    fileInput.type = 'file';
    fileInput.addEventListener('change', ()=> {
        editor.loader.loadFiles(fileInput.files);
        form.reset();
    });
    form.appendChild(fileInput);


}