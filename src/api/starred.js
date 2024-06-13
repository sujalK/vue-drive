import http from './http';

export const starredFiles = () => http.get('/files?starred=true');

export const addFileToStarred = (file) => http.put(`/files/${file.id}/star`, {
  "starred": true
});

export const removeFileFromStarred = (file) => http.put(`/files/${file.id}/star`, {
  "starred": false
});



export const starredFolders = () => http.get('/folders?starred=true');

export const addFolderToStarred = (folder) => http.put(`/folders/${folder.id}/star`, {
  "starred": true
});

export const removeFolderFromStarred = (folder) => http.put(`/folders/${folder.id}/star`, {
  "starred": false
});