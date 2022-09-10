// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
define([
    'jquery',
    'base/js/dialog',
    'base/js/i18n',
    'underscore',
    'base/js/namespace'
], function ($, dialog, i18n, _, IPython) {
    'use strict';
    $('#notebook_about').click(function () {
        const sys_info = window.sys_info;
        let textNb = "Vous utilisez le Notebook de <b>Basthon</b>";
        textNb += "<br>";
        textNb += `Identifiant de commit : <code>${sys_info['commit-hash']}</code>`;
        textNb += "<br>";
        textNb += `Date du commit : <code>${sys_info['commit-date']}</code>`;
        let textKernel = "Vous utilisez le noyau <b>Basthon</b>";
        textKernel += "<br>";
        textKernel += `Langage du noyau : <code>${window.basthonLanguage}</code>`;
        textKernel += "<br>";
        textKernel += `Version du noyau : <code>${sys_info['kernel-version']}</code>`;
        var body = $('<div/>');
        body.append($('<h4/>').text(i18n.msg._('Current Notebook Information:')));
        body.append($('<p/>').html(textNb));
        body.append($('<h4/>').text(i18n.msg._('Current Kernel Information:')));
        body.append($('<p/>').html(textKernel));
        //[Basthon]
        /*
        // use underscore template to auto html escape
        if (sys_info) {
          var text = i18n.msg._('You are using Jupyter notebook.');
          text = text + '<br/><br/>';
          text = text + i18n.msg._('The version of the notebook server is: ');
          text = text + _.template('<b><%- version %></b>')({ version: sys_info.notebook_version });
          if (sys_info.commit_hash) {
              text = text + _.template('-<%- hash %>')({ hash: sys_info.commit_hash });
          }
         text = text + '<br/>';
         text = text + i18n.msg._('The server is running on this version of Python:');
          text = text + _.template('<br/><pre>Python <%- pyver %></pre>')({ 
            pyver: sys_info.sys_version });
          var kinfo = $('<div/>').attr('id', '#about-kinfo').text(i18n.msg._('Waiting for kernel to be available...'));
          var body = $('<div/>');
          body.append($('<h4/>').text(i18n.msg._('Server Information:')));
          body.append($('<p/>').html(text));
          body.append($('<h4/>').text(i18n.msg._('Current Kernel Information:')));
          body.append(kinfo);
        } else {
          var text = i18n.msg._('Could not access sys_info variable for version information.');
          var body = $('<div/>');
          body.append($('<h4/>').text(i18n.msg._('Cannot find sys_info!')));
          body.append($('<p/>').html(text));
        }
        */
        dialog.modal({
            title: i18n.msg._('About Jupyter Notebook'),
            body: body,
            buttons: { 'OK': {} }
        });
        //[Basthon]
        /*
        try {
            IPython.notebook.session.kernel.kernel_info(function (data) {
                kinfo.html($('<pre/>').text(data.content.banner));
            });
        } catch (e) {
            kinfo.html($('<p/>').text(i18n.msg._('unable to contact kernel')));
        }
        */
    });
});
