from typing import Callable
import traceback
import js


class Validation:
    def __init__(
        self,
        inputs: list,
        outputs: list,
        message_valeurs: str = "❌ Ta fonction ne renvoie pas les bonnes valeurs",
        message_execution: str = "❌ Ta fonction ne s'execute pas, voici le message d'erreur:",
        message_succes: str = "✅ Félicitation ! Ton code fonctionne",
    ):
        """Cette classe teste une fonction f sur un liste d'inputs/outputs, renvoie des messages
        en cas d'erreur et déclenche l'apparition des prochaines cellules sinon."""
        self.inputs = inputs
        self.outputs = outputs
        self.message_valeurs = message_valeurs
        self.message_execution = message_execution
        self.message_succes = message_succes

    def __call__(self, f: Callable):
        for input, output in zip(self.inputs, self.outputs):
            try:  # test si la fonction renvoie les bonnes valeurs
                result = f(input)
                if result != output:
                    print(self.message_valeurs)
                    return
            except:  # si la fonction ne s'execute pas, affiche le message d'erreur
                print(self.message_execution)
                print(traceback.format_exc())
                return
        # la fonction est vérifiée sur toutes les entrées/sorties, on peut afficher la suite
        print(self.message_succes)

        js.Jupyter.notebook.next_validation_cell()
