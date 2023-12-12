# Import des librairies utilisées dans le notebook
#import basthon
import requests
import numpy as np
import matplotlib.pyplot as plt
import pickle
from zipfile import ZipFile
from io import BytesIO, StringIO
from matplotlib.colors import LinearSegmentedColormap, ListedColormap
import matplotlib.patches as mpatches
from scipy.spatial import Voronoi, voronoi_plot_2d
from tqdm.notebook import tqdm
from validation_kernel import *


### ----- PARAMÈTRES D'AFFICHAGE ----
plt.rcParams['figure.dpi'] = 150


### --- DONNEES ---
# Téléchargement et extraction des inputs contenus dans l'archive zip
inputs_zip_url = "https://raw.githubusercontent.com/akimx98/challenge_data/main/input_mnist_2_10.zip"
inputs_zip = requests.get(inputs_zip_url)
zf = ZipFile(BytesIO(inputs_zip.content))
zf.extractall()
zf.close()


# Téléchargement des outputs d'entraînement de MNIST-10 contenus dans le fichier y_train_10.csv
output_train_url = "https://raw.githubusercontent.com/akimx98/challenge_data/main/y_train_10.csv"
output_train = requests.get(output_train_url)

# Création des variables d'inputs, outputs et indices pour les datasets MNIST-2, MNIST-4 et MNIST-10

# MNIST-10

# Inputs and indices
with open('mnist_10_x_train.pickle', 'rb') as f:
    ID_train_10, x_train_10 = pickle.load(f).values()

with open('mnist_10_x_test.pickle', 'rb') as f:
    ID_test_10, x_test_10 = pickle.load(f).values()

# Outputs
_, y_train_10 = [np.loadtxt(StringIO(output_train.content.decode('utf-8')),
                                dtype=int, delimiter=',')[:,k] for k in [0,1]]

# MNIST-2
chiffre_1 = 2
chiffre_2 = 7
chiffres = [chiffre_1, chiffre_2]
classes = [-1,1]

# Inputs
with open('mnist_2_x_train.pickle', 'rb') as f:
    ID_train_2, x_train_2 = pickle.load(f).values()

with open('mnist_2_x_test.pickle', 'rb') as f:
    ID_test_2, x_test_2 = pickle.load(f).values()

# Outputs
y_train_2 = y_train_10[np.isin(y_train_10, chiffres)]

# Ici le x_train c'est celui de MNIST-2

# Utiliser ces indices pour extraire les images correspondantes de x_train_10
x_train = x_train_2
x_test = x_test_2
y_train_chiffres = y_train_2.copy()
y_train = y_train_2.copy()

# classe : -1/1
y_train[y_train_chiffres == chiffre_1] = -1
y_train[y_train_chiffres == chiffre_2] = 1

N = len(x_train)

x_train_par_population = [x_train[y_train==k] for k in classes]

x = x_train[0,:,:]

# Calculer l'estimation et l'erreur : 
def erreur_train(x_train, y_train, t, classification):
    n = len(x_train)
    y_train_est = []
    for i in range(n):
        x = x_train[i]
        y = y_train[i]
        y_train_est.append(classification(x, t))
    
    return np.mean(np.array(y_train_est) != np.array(y_train))
        
        
# Erreurs
# Fonction qui calcule l'erreur pour une image x, en fonction de la réponse y et du paramètre s
def erreur_image(x, y, s):
    global caracteristique, classification, N
    c = caracteristique(x)
    y_est = classification(x, s)
    
    if y_est == y:
        erreur = 0
    else:
        erreur = 1
        
    return erreur

# Fonction qui calcule la moyenne des erreur par image pour donner l'erreur d'entrainement
def erreur_train_bis(x_train, y_train, s):
    liste_erreurs = []

    for i in range(N):
        x = x_train[i]
        y = y_train[i]
        
        erreur = erreur_image(x, y, s)
        liste_erreurs.append(erreur)
        
    return moyenne(liste_erreurs)

def visualiser_scatter_2d_mnist_2(c_train, avec_centroides = False):
    nb_digits = len(chiffres)
    c_train_par_population = [np.array(c_train)[y_train==k] for k in classes]

    # Deux premières couleurs par défaut de Matplotlib
    colors = ['C0', 'C1']
    
    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    mins_ = np.concatenate(c_train_par_population).min(axis=0)
    
    fig, ax = plt.subplots(figsize=(6,6))
    for i in range(nb_digits):  # ordre inversé pour un meilleur rendu
        ax.scatter(c_train_par_population[i][:,0], c_train_par_population[i][:,1], marker = '+', s = 20, c=colors[i], linewidth=0.5)

    # Définir les borne inf et sup des axes. On veut que le point (0,0) soit toujours sur le graphe
    x_min, x_max = min(0, mins_[0]), max(0, maxs_[0])
    y_min, y_max = min(0, maxs_[1]), max(0, maxs_[1])
    ax.set_xlim((x_min, x_max))
    ax.set_ylim((y_min, y_max))
    
    # Afficher les centroides
    if avec_centroides:
        # Moyennes
        N_ = [len(c_train_par_population[i][:,0]) for i in range(nb_digits)]
        M_x = [sum(c_train_par_population[i][:,0])/N_[i] for i in range(nb_digits)]
        M_y = [sum(c_train_par_population[i][:,1])/N_[i] for i in range(nb_digits)]
        for i in range(nb_digits):
            ax.scatter(M_x[i], M_y[i], marker = 'o', s = 70, edgecolor='black', linewidth=1.9, c=colors[i])

    patches = [mpatches.Patch(color=colors[i], label="$\hat y = $"+str(classes[i])+" (chiffre : "+str(chiffres[i])+")") for i in range(nb_digits)]
    ax.legend(handles=patches,loc='upper left')
    
    # Enlever les axes de droites et du haut
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    
    # Centrer les axes en (0,0)
    ax.spines['left'].set_position(('data', 0))
    ax.spines['bottom'].set_position(("data", 0))

    
    #Afficher les flèches au bout des axes
    ax.plot(1, 0, ">k", transform=ax.get_yaxis_transform(), clip_on=False)
    ax.plot(0, 1, "^k", transform=ax.get_xaxis_transform(), clip_on=False)   
    
    # Nom des axex
    ax.set_xlabel('$k_1$', loc='right')
    ax.set_ylabel('$k_2$', loc='top', rotation='horizontal')
    
    #plt.savefig('hist_2d_MNIST2.png', dpi = 300)
    plt.show()
    plt.close()

def erreur_lineaire(m, p, c_train, y_train):
    y_est_train = np.sign(m * c_train[:, 0] - c_train[:, 1] + p)
    erreurs = (y_est_train != y_train).astype(int)
    return np.mean(erreurs)

# def erreur_lineaire(m, p,c_train):
#     liste_erreurs = []

#     # On remplit y_est_train à l'aide d'une boucle :
#     for i in range(N):
#         x = x_train[i]
#         y = y_train[i]
#         x_1, x_2 = c_train[i]
#         y_est = classificateur(m, p, x_1, x_2)

#         if y_est == y:
#             erreur = 0
#         else:
#             erreur = 1

#         liste_erreurs.append(erreur)

#     return np.mean(liste_erreurs)

def tracer_separatrice(m, p, c_train):
    nb_digits = len(chiffres)
    c_train_par_population = [np.array(c_train)[y_train==k] for k in classes]

    colors = ['C0', 'C1']

    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    mins_ = np.concatenate(c_train_par_population).min(axis=0)
    fig, ax = plt.subplots(figsize=(6,6))
    for i in range(nb_digits):  
        ax.scatter(c_train_par_population[i][:,0], c_train_par_population[i][:,1], marker = '+', s = 20, c=colors[i], linewidth=0.5)

    # Sauvegarde des limites actuelles
    xlim = ax.get_xlim()
    ylim = ax.get_ylim()

    # Ajouter la droite
    x = np.linspace(mins_[0], maxs_[0], 1000)
    y = m*x + p
    ax.plot(x, y, '-r', label='y=mx+p')  # Ajout de la droite en rouge

    # Restauration des limites initiales
    ax.set_xlim(xlim)
    ax.set_ylim(ylim)

    patches = [mpatches.Patch(color=colors[i], label=classes[i]) for i in range(nb_digits)]
    ax.legend(handles=patches,loc='upper left')

    plt.show()
    plt.close()

def titre_image(rng):
    titre = "y = "+str(y_train[rng])+" (chiffre = "+str(y_train_chiffres[rng])+")"
    return titre


# Affichage d'une image
def affichage(image, titre=""):
    fig, ax = plt.subplots(figsize=(2,2))
    ax.imshow(image, cmap='gray')
    ax.set_title(titre)
    plt.show()
    plt.close()

# Affichage 10 avec les valeurs de y en dessous
def affichage_dix(images, liste_y = y_train):
    global y_train
    fig, ax = plt.subplots(1, 10, figsize=(10, 1))
    
    # Cachez les axes des subplots
    for j in range(10):
        ax[j].axis('off')
        ax[j].imshow(images[j], cmap='gray')
    
    # Affichez les classes
    if liste_y is not None:
        for k in range(10):
            fig.text((k+0.5)/10, 0, '$y = $'+str(liste_y[k]), va='top', ha='center', fontsize=12)
    
    plt.subplots_adjust(left=0, right=1, top=1, bottom=0.2, wspace=0.05, hspace=0)
    plt.show()
    plt.close()

# Affichage de vingt images
def affichage_vingt(images):
    fig, ax = plt.subplots(2, 10, figsize=(10,2))
    for k in range(20):
        ax[k//10,k%10].imshow(images[k], cmap='gray')
        ax[k//10,k%10].set_xticks([])
        ax[k//10,k%10].set_yticks([])
    plt.subplots_adjust(left=0, right=1, top=1, bottom=0, wspace=0.05, hspace=0.05)
    plt.show()
    plt.close()

# Affichage de trente images
def affichage_trente(images):
    fig, ax = plt.subplots(3, 10, figsize=(10,3))
    for k in range(30):
        ax[k//10,k%10].imshow(images[k], cmap='gray')
        ax[k//10,k%10].set_xticks([])
        ax[k//10,k%10].set_yticks([])
    plt.subplots_adjust(left=0, right=1, top=1, bottom=0, wspace=0.05, hspace=0.05)
    plt.show()
    plt.close()

# Sauver le .csv

def sauver_et_telecharger_mnist_2(y_est_test, nom_du_fichier):
    np.savetxt(nom_du_fichier, np.stack([ID_test_2, y_est_test], axis=-1), fmt='%d', delimiter=',', header='ID,targets')
    basthon.download(nom_du_fichier)

def sauver_et_telecharger_mnist_4(y_est_test, nom_du_fichier):
    np.savetxt(nom_du_fichier, np.stack([ID_test_4, y_est_test], axis=-1), fmt='%d', delimiter=',', header='ID,targets')
    basthon.download(nom_du_fichier)

def sauver_et_telecharger_mnist_10(y_est_test, nom_du_fichier):
    np.savetxt(nom_du_fichier, np.stack([ID_test_10, y_est_test], axis=-1), fmt='%d', delimiter=',', header='ID,targets')
    basthon.download(nom_du_fichier)

# Visualiser les histogrammes
def visualiser_histogrammes_mnist_2(c_train, size='grand', legend_loc='upper right'):
    if size == 'grand':
        font_size = 14
    elif size == 'petit':
        font_size = 17
    else:
        raise ValueError("size doit valoir 'grand' ou 'petit'") 
    
    
    nb_digits = len(chiffres)
    c_train_par_population = [np.array(c_train)[y_train==k] for k in classes]

    # Deux premières couleurs par défaut de Matplotlib
    colors = ['C0', 'C1']

    fig, ax = plt.subplots(figsize=(8,5))
    # Visualisation des histogrammes
    for k in range(nb_digits):
        ax.hist(c_train_par_population[k], bins=60, alpha=0.7, density = False, 
                label="$y = $"+str(classes[k])+" (chiffre : "+str(chiffres[k])+")")

    ax.set_xlim(xmin=0)
    #ax.set_ylim(ymax = 395)
    #ax.set_title("Histogrammes de la caractéristique")
    ax.legend(loc=legend_loc, fontsize=font_size+2)
    
    # Font size pour les ticks
    ax.tick_params(axis='both', labelsize=font_size)

    # Enlever les axes de droites et du haut
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    
    # Centrer les axes en (0,0)
    ax.spines['left'].set_position(('data', 0))
    ax.spines['bottom'].set_position(("data", 0))

    
    #Afficher les flèches au bout des axes
    ax.plot(1, 0, ">k", transform=ax.get_yaxis_transform(), clip_on=False)
    ax.plot(0, 1, "^k", transform=ax.get_xaxis_transform(), clip_on=False)   
    
    # Nom des axex
    ax.set_xlabel('$k$', loc='right', fontsize=font_size)
    ax.set_ylabel('$h$ et $g$', loc='top', rotation='horizontal', fontsize=font_size)

    plt.show()
    plt.close()


# Visualiser les histogrammes
def visualiser_histogrammes_mnist_4(c_train_par_population):
    digits = [0,1,4,8]
    nb_digits = 4

    # Visualisation des histogrammes
    for k in range(nb_digits):
        plt.hist(np.array(c_train_par_population[k]), bins=60, alpha=0.7, label=digits[k], density = True)

    plt.gca().set_xlim(xmin=0)
    plt.gca().set_title("Histogrammes de la caractéristique")
    plt.legend(loc='upper right')
    plt.show()
    plt.close()

# Visualiser les histogrammes 2D
def visualiser_histogrammes_2d_mnist_4(c_train):

    c_train_par_population = par_population(c_train)

    digits = [0,1,4,8]
    nb_digits = 4

    # Moyennes
    N = [len(c_train_par_population[i][:,0]) for i in range(nb_digits)]
    M_x = [sum(c_train_par_population[i][:,0])/N[i] for i in range(nb_digits)]
    M_y = [sum(c_train_par_population[i][:,1])/N[i] for i in range(nb_digits)]

    # Quatre premières couleurs par défaut de Matplotlib
    colors = {0:'C0', 1:'C1', 4:'C2', 8:'C3'}
    # Palette de couleurs interpolant du blanc à chacune de ces couleurs, avec N=100 nuances
    cmaps = [LinearSegmentedColormap.from_list("", ["w", colors[i]], N=100) for i in digits]
    # Ajout de transparence pour la superposition des histogrammes :
    # plus la couleur est proche du blanc, plus elle est transparente
    cmaps_alpha = []
    for cmap in cmaps:
        cmap._init()
        cmap._lut[:-3,-1] = np.linspace(0, 1, cmap.N)  # la transparence va de 0 (complètement transparent) à 1 (opaque)
        cmaps_alpha += [ListedColormap(cmap._lut[:-3,:])]

    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    mins_ = np.concatenate(c_train_par_population).min(axis=0)
    fig, ax = plt.subplots(figsize=(10,10))
    for i in reversed(range(nb_digits)):  # ordre inversé pour un meilleur rendu
        ax.hist2d(c_train_par_population[i][:,0], c_train_par_population[i][:,1],
                  bins=[np.linspace(min(0, mins_[0]),maxs_[0],100), np.linspace(min(0, mins_[1]),maxs_[1],100)], cmap=cmaps_alpha[i])

    for i in reversed(range(nb_digits)):
        ax.scatter(M_x[i], M_y[i], marker = 'o', s = 70, edgecolor='black', linewidth=1.5, facecolor=colors[list(colors.keys())[i]])

    patches = [mpatches.Patch(color=colors[i], label=i) for i in digits]
    ax.legend(handles=patches,loc='upper left')

    plt.show()
    plt.close()


# Visualiser les histogrammes 2D avec les domaines de Voronoi
def visualiser_histogrammes_2d_mnist_4_vor(c_train):
    c_train_par_population = par_population(c_train)

    digits = [0,1,4,8]
    nb_digits = 4

    # Moyennes
    N = [len(c_train_par_population[i][:,0]) for i in range(nb_digits)]
    M_x = [sum(c_train_par_population[i][:,0])/N[i] for i in range(nb_digits)]
    M_y = [sum(c_train_par_population[i][:,1])/N[i] for i in range(nb_digits)]
    theta = [np.mean(c_train_par_population[i], axis = 0) for i in range(4)]

    # Quatre premières couleurs par défaut de Matplotlib
    colors = {0:'C0', 1:'C1', 4:'C2', 8:'C3'}
    # Palette de couleurs interpolant du blanc à chacune de ces couleurs, avec N=100 nuances
    cmaps = [LinearSegmentedColormap.from_list("", ["w", colors[i]], N=100) for i in digits]
    # Ajout de transparence pour la superposition des histogrammes :
    # plus la couleur est proche du blanc, plus elle est transparente
    cmaps_alpha = []
    for cmap in cmaps:
        cmap._init()
        cmap._lut[:-3,-1] = np.linspace(0, 1, cmap.N)  # la transparence va de 0 (complètement transparent) à 1 (opaque)
        cmaps_alpha += [ListedColormap(cmap._lut[:-3,:])]

    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    mins_ = np.concatenate(c_train_par_population).min(axis=0)

    fig, ax = plt.subplots(figsize=(10,10))

    # Voronoi
    vor = Voronoi(theta)
    fig = voronoi_plot_2d(vor, ax=ax, show_points=False)

    for i in reversed(range(nb_digits)):  # ordre inversé pour un meilleur rendu
        ax.hist2d(c_train_par_population[i][:,0], c_train_par_population[i][:,1],
                  bins=[np.linspace(min(0, mins_[0]),maxs_[0],100), np.linspace(min(0, mins_[1]),maxs_[1],100)], cmap=cmaps_alpha[i])

    for i in reversed(range(nb_digits)):
        ax.scatter(M_x[i], M_y[i], marker = 'o', s = 70, edgecolor='black', linewidth=1.5, facecolor=colors[list(colors.keys())[i]])

    patches = [mpatches.Patch(color=colors[i], label=i) for i in digits]
    ax.legend(handles=patches,loc='upper left')

    plt.show()
    plt.close()

# Visualiser les histogrammes 2d avec les argmax des 4 distributions
def visualiser_histogrammes_2d_mnist_4_max(c_train):

    c_train_par_population = par_population(c_train)

    digits = [0,1,4,8]
    nb_digits = 4

    # Moyennes
    N = [len(c_train_par_population[i][:,0]) for i in range(nb_digits)]
    M_x = [sum(c_train_par_population[i][:,0])/N[i] for i in range(nb_digits)]
    M_y = [sum(c_train_par_population[i][:,1])/N[i] for i in range(nb_digits)]

    max_list = max_hist_2d_mnist4(c_train)

    # Quatre premières couleurs par défaut de Matplotlib
    colors = {0:'C0', 1:'C1', 4:'C2', 8:'C3'}
    # Palette de couleurs interpolant du blanc à chacune de ces couleurs, avec N=100 nuances
    cmaps = [LinearSegmentedColormap.from_list("", ["w", colors[i]], N=100) for i in digits]
    # Ajout de transparence pour la superposition des histogrammes :
    # plus la couleur est proche du blanc, plus elle est transparente
    cmaps_alpha = []
    for cmap in cmaps:
        cmap._init()
        cmap._lut[:-3,-1] = np.linspace(0, 1, cmap.N)  # la transparence va de 0 (complètement transparent) à 1 (opaque)
        cmaps_alpha += [ListedColormap(cmap._lut[:-3,:])]

    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    fig, ax = plt.subplots(figsize=(10,10))
    for i in reversed(range(nb_digits)):  # ordre inversé pour un meilleur rendu
        ax.hist2d(c_train_par_population[i][:,0], c_train_par_population[i][:,1],
                  bins=[np.linspace(0,maxs_[0],100), np.linspace(0,maxs_[1],100)], cmap=cmaps_alpha[i])

    for i in reversed(range(nb_digits)):
        ax.scatter(max_list[i][0], max_list[i][1], marker = 'o', s = 70, edgecolor='black', linewidth=1.5, facecolor=colors[list(colors.keys())[i]])

    patches = [mpatches.Patch(color=colors[i], label=i) for i in digits]
    ax.legend(handles=patches,loc='upper left')

    plt.show()
    plt.close()


# Visualiser les histogrammes 2D pour MNIST-10
def visualiser_histogrammes_2d_mnist_10(c_train):
    c_train_par_population = par_population_10(c_train)
    digits = np.arange(10).tolist()
    nb_digits = 10

    # Moyennes
    N_ = [len(c_train_par_population[i][:,0]) for i in range(nb_digits)]
    M_x = [sum(c_train_par_population[i][:,0])/N_[i] for i in range(nb_digits)]
    M_y = [sum(c_train_par_population[i][:,1])/N_[i] for i in range(nb_digits)]

    # Palette de couleurs interpolant du blanc à chacune de ces couleurs, avec N=100 nuances
    cmaps = [LinearSegmentedColormap.from_list("", ["w", 'C'+str(i)], N=100) for i in digits]
    # Ajout de transparence pour la superposition des histogrammes :
    # plus la couleur est proche du blanc, plus elle est transparente
    cmaps_alpha = []
    for cmap in cmaps:
        cmap._init()
        cmap._lut[:-3,-1] = np.linspace(0, 1, cmap.N)  # la transparence va de 0 (complètement transparent) à 1 (opaque)
        cmaps_alpha += [ListedColormap(cmap._lut[:-3,:])]

    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    mins_ = np.concatenate(c_train_par_population).min(axis=0)
    fig, ax = plt.subplots(figsize=(10,10))
    for i in reversed(range(nb_digits)):  # ordre inversé pour un meilleur rendu
        ax.hist2d(c_train_par_population[i][:,0], c_train_par_population[i][:,1],
                  bins=[np.linspace(min(0, mins_[0]),maxs_[0],100), np.linspace(min(0, mins_[1]),maxs_[1],100)], cmap=cmaps_alpha[i])

    for i in reversed(range(nb_digits)):
        ax.scatter(M_x[i], M_y[i], marker = 'o', s = 70, edgecolor='black', linewidth=1.5, facecolor='C'+str(i))

    patches = [mpatches.Patch(color='C'+str(i), label=i) for i in digits]
    ax.legend(handles=patches,loc='upper left')

    plt.show()
    plt.close()

# Visualiser les 10 hist 2D de MNIST-10 avec les domaines de voronoi
def visualiser_histogrammes_2d_mnist_10_vor(c_train):
    c_train_par_population = par_population_10(c_train)
    digits = np.arange(10).tolist()
    nb_digits = 10

    # Moyennes
    N_ = [len(c_train_par_population[i][:,0]) for i in range(nb_digits)]
    M_x = [sum(c_train_par_population[i][:,0])/N_[i] for i in range(nb_digits)]
    M_y = [sum(c_train_par_population[i][:,1])/N_[i] for i in range(nb_digits)]
    theta = [np.mean(c_train_par_population[i], axis = 0) for i in range(nb_digits)]

    # Palette de couleurs interpolant du blanc à chacune de ces couleurs, avec N=100 nuances
    cmaps = [LinearSegmentedColormap.from_list("", ["w", 'C'+str(i)], N=100) for i in digits]
    # Ajout de transparence pour la superposition des histogrammes :
    # plus la couleur est proche du blanc, plus elle est transparente
    cmaps_alpha = []
    for cmap in cmaps:
        cmap._init()
        cmap._lut[:-3,-1] = np.linspace(0, 1, cmap.N)  # la transparence va de 0 (complètement transparent) à 1 (opaque)
        cmaps_alpha += [ListedColormap(cmap._lut[:-3,:])]

    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    mins_ = np.concatenate(c_train_par_population).min(axis=0)
    fig, ax = plt.subplots(figsize=(10,10))

    # Voronoi
    vor = Voronoi(theta)
    fig = voronoi_plot_2d(vor, ax=ax, show_points=False)

    for i in reversed(range(nb_digits)):  # ordre inversé pour un meilleur rendu
        ax.hist2d(c_train_par_population[i][:,0], c_train_par_population[i][:,1],
                  bins=[np.linspace(min(0, mins_[0]),maxs_[0],100), np.linspace(min(0, mins_[1]),maxs_[1],100)], cmap=cmaps_alpha[i])

    for i in reversed(range(nb_digits)):
        ax.scatter(M_x[i], M_y[i], marker = 'o', s = 70, edgecolor='black', linewidth=1.5, facecolor='C'+str(i))

    patches = [mpatches.Patch(color='C'+str(i), label=i) for i in digits]
    ax.legend(handles=patches,loc='upper left')

    plt.show()
    plt.close()

# Trouve les coordonnées qui réalisent le max de chaque hist 2D de la caractéristique
def max_hist_2d_mnist4(c_train):
    c_train_par_population = par_population(c_train)

    digits = [0,1,4,8]
    nb_digits = 4
    max_list = []

    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    for i in range(nb_digits):
        H, xedges, yedges = np.histogram2d(c_train_par_population[i][:,0], c_train_par_population[i][:,1],
            bins=[np.linspace(0,maxs_[0],60), np.linspace(0,maxs_[1],60)])
        x, y = np.argwhere(H == H.max())[0]
        max_list.append([np.average(xedges[x:x + 2]), np.average(yedges[y:y + 2])])

    return max_list


# Visualiser dans le plan dix caractéristiques 2D pour chaque population
def visualiser_caracteristiques_2d_dix(c_train_par_population):
    digits = [0,1,4,8]
    for k in range(4):
        plt.scatter(c_train_par_population[k][:10,0], c_train_par_population[k][:10,1],label=digits[k])
    plt.legend(loc='upper left')
    plt.show()
    plt.close()

# Fonction de score
def score(y_est, y_vrai):
    if len(y_est) != len(y_vrai):
        raise ValueError("Les sorties comparées ne sont pas de la même taille.")
    
    return np.mean(np.array(y_est) != np.array(y_vrai))

# Pour tracer la fonction erreur
from matplotlib.ticker import AutoMinorLocator

def tracer_erreur(t_min, t_max, func_classif):
    pas_t = 2
    pas_x = 4
    scores_list = []
    for t in range(t_min, t_max, pas_t):
        e_train = 100*erreur_train(x_train[::pas_x], y_train[::pas_x], t, func_classif)
        scores_list.append(e_train)

    fig, ax1 = plt.subplots(figsize=(7, 4))
    ax1.scatter(np.arange(t_min, t_max, pas_t), scores_list, marker='+', zorder=3)
    ax1.set_title("Erreur d'entrainement en fonction du paramètre seuil, MNIST 2 & 7")
    ax1.set_ylim(ymin=0, ymax=70)
    ax1.set_xticks(np.arange(t_min, t_max, 2*pas_t))
    ax1.xaxis.set_minor_locator(AutoMinorLocator())
    ax1.yaxis.set_minor_locator(AutoMinorLocator())
    plt.grid(which='both', linestyle='--', linewidth=0.5)
    plt.tight_layout()
    plt.show()
    plt.close()
    
# def tracer_erreur(t_min, t_max, func_classif):
#     pas_t = 2
#     pas_x = 4
#     scores_list = []
#     for t in tqdm(range(t_min, t_max, pas_t), desc='En cours de calcul... ', leave=True):
#         e_train = erreur_train(x_train[::pas_x], y_train[::pas_x], t, func_classif)
#         scores_list.append(e_train)

#     fig, ax1 = plt.subplots(figsize=(7, 4))
#     ax1.scatter(np.arange(t_min, t_max, pas_t), scores_list, marker='+', zorder=3)
#     ax1.set_title("Erreur d'entrainement en fonction du paramètre seuil, MNIST 2 & 7")
#     ax1.set_ylim(ymin=0, ymax=0.7)
#     ax1.set_xticks(np.arange(t_min, t_max, 2*pas_t))
#     ax1.xaxis.set_minor_locator(AutoMinorLocator())
#     ax1.yaxis.set_minor_locator(AutoMinorLocator())
#     plt.grid(which='both', linestyle='--', linewidth=0.5)
#     plt.tight_layout()
#     plt.show()
#     plt.close()

# def tracer_erreur(s_min, s_max, pas, func_classif):
#     scores_list = []
#     for s in range(s_min, s_max, pas):
#         y_est_train = []
#         for x in x_train[::2]:
#             y_est_train.append(func_classif(x, s))
#         scores_list.append(score(y_est_train, y_train[::2]))

#     fig, ax1 = plt.subplots(figsize=(7, 4))
#     ax1.scatter(np.arange(s_min, s_max, pas), scores_list, marker='+', zorder=3)  # zorder=3 pour placer les croix au-dessus de la grille
#     ax1.set_title("Erreur d'entrainement en fonction du paramètre seuil, MNIST 1 & 6")
#     ax1.set_ylim(ymin=0, ymax=0.7)

#     # Pour afficher des valeurs plus précises sur l'axe x
#     ax1.set_xticks(np.arange(s_min, s_max, 5*pas))
    
#     # Pour ajouter des subticks sur l'axe x et y pour rendre la grille plus fine
#     ax1.xaxis.set_minor_locator(AutoMinorLocator())
#     ax1.yaxis.set_minor_locator(AutoMinorLocator())

#     plt.grid(which='both', linestyle='--', linewidth=0.5)  # Afficher les grilles principales et secondaires
#     plt.tight_layout()  # Ajuster l'affichage pour éviter tout chevauchement
#     plt.show()
#     plt.close()



# Moyenne
def moyenne(liste):
    arr = np.array(liste)
    return np.mean(arr)

def par_population_4(liste):
    chiffres = [0,1,4,8]
    # Créer une liste de liste qui divise par population, comme par exemple pour liste = c_train
    return [np.array(liste)[y_train_4==k] for k in chiffres]

def par_population_10(liste):
    # Créer une liste de liste qui divise par population, comme par exemple pour liste = c_train
    return [np.array(liste)[y_train_10==k] for k in range(10)]

def par_population_mnist_2(liste):
    # Créer une liste de liste qui divise par population, comme par exemple pour liste = c_train
    return [np.array(liste)[y_train_2==k] for k in chiffres]

def distance_carre(a,b):
    # a et b sont supposés être des points en deux dimensions contenus dans des listes de longueur deux
    return (a[0]-b[0])**2 + (a[1]-b[1])**2

def distance_carre_gen(A, B):
    return np.sum((A-B)**2)

def classification_2d_MNIST4(c, theta):

    #c_train_moyennes_par_population = [moyenne(liste_car) for liste_car in c_train_par_population]

    # On définit d'abord les différentes estimations possibles
    chiffres = [0,1,4,8]
    # On calcule le carré des distances entre la caractéristique c et les caractéristiques moyennes
    dist = [distance_carre(c, theta_i) for theta_i in theta]
    # On extrait l'indice minimisant cette distance
    index_min = dist.index(min(dist))
    # On renvoie le chiffre correspondant
    return chiffres[index_min]

# Algorithme de classification pour les 10 catégories de chiffres
def classification_dist_moy(c, theta_):
    # On définit d'abord les différentes estimations possibles
    chiffres = np.arange(10).tolist()
    # On calcule le carré des distances entre la caractéristique c et les caractéristiques moyennes
    dist = [distance_carre_gen(np.array(c).flatten(), np.array(theta).flatten()) for theta in theta_]
    # On extrait l'indice minimisant cette distance
    index_min = dist.index(min(dist))
    # On renvoie le chiffre correspondant
    return chiffres[index_min]

def visualiser_histogrammes_2d_mnist_2(c_train):

    c_train_par_population = par_population_mnist2(c_train)

    digits = [0,1]
    nb_digits = 2

    # Moyennes
    N = [len(c_train_par_population[i][:,0]) for i in range(nb_digits)]
    M_x = [sum(c_train_par_population[i][:,0])/N[i] for i in range(nb_digits)]
    M_y = [sum(c_train_par_population[i][:,1])/N[i] for i in range(nb_digits)]

    # Quatre premières couleurs par défaut de Matplotlib
    colors = {0:'C0', 1:'C1', 4:'C2', 8:'C3'}
    # Palette de couleurs interpolant du blanc à chacune de ces couleurs, avec N=100 nuances
    cmaps = [LinearSegmentedColormap.from_list("", ["w", colors[i]], N=100) for i in digits]
    # Ajout de transparence pour la superposition des histogrammes :
    # plus la couleur est proche du blanc, plus elle est transparente
    cmaps_alpha = []
    for cmap in cmaps:
        cmap._init()
        cmap._lut[:-3,-1] = np.linspace(0, 1, cmap.N)  # la transparence va de 0 (complètement transparent) à 1 (opaque)
        cmaps_alpha += [ListedColormap(cmap._lut[:-3,:])]

    maxs_ = np.concatenate(c_train_par_population).max(axis=0)
    mins_ = np.concatenate(c_train_par_population).min(axis=0)
    fig, ax = plt.subplots(figsize=(10,10))
    for i in reversed(range(nb_digits)):  # ordre inversé pour un meilleur rendu
        ax.hist2d(c_train_par_population[i][:,0], c_train_par_population[i][:,1],
                  bins=[np.linspace(mins_[0],maxs_[0],100), np.linspace(mins_[1],maxs_[1],100)], cmap=cmaps_alpha[i])

    for i in reversed(range(nb_digits)):
        ax.scatter(M_x[i], M_y[i], marker = 'o', s = 70, edgecolor='black', linewidth=1.5, facecolor=colors[list(colors.keys())[i]])

    patches = [mpatches.Patch(color=colors[i], label=i) for i in digits]
    ax.legend(handles=patches,loc='upper left')

    plt.show()
    plt.close()
#---



### ----- CELLULES VALIDATION ----

# Question 1
validation_question_1 = Validation_values(8)

# Question 2
value_2 = x[14, 14].copy()
validation_question_2 = Validation_values(value_2)

# Question 3
value_3 = x[:, 11:24].copy()
validation_question_3 = Validation_lambda(lambda y: (value_3.shape == y.shape) and (y==value_3).all(),message_values = "❌ Ton code ne fonctionne pas, es-tu sûr(e) d'avoir un tableau de la bonne taille ?")

# Question 4
validation_question_4 = Validation_lambda(lambda y: y == 1 or y==-1,message_values = "❌ Ton code ne fonctionne pas, es-tu sûr(e) d'avoir bien rempli puis executé les deux cellules (cases de code) précédentes ? Attention à bien renvoyer -1 ou 1.")

## --

