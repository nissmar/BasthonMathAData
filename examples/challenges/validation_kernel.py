from typing import Callable
import traceback
import js


class Validation:
    def __init__(
        self,
        test_function, 
        message_values,
        message_execution,
        message_succes,
    ):
        self.test_function = test_function
        self.message_values = message_values
        self.message_execution = message_execution
        self.message_succes = message_succes
        self._validated = False

    def __call__(self, kwargs):
        try: 
            result = self.test_function(kwargs)
            if not result:
                print(self.message_values)
                return
        except:
            print(self.message_execution)
            print(traceback.format_exc())
            return
        print(self.message_succes)
        if not self._validated:
            self._validated = True
            js.Jupyter.notebook.next_validation_cell()


class Validation_function(Validation):
    def __init__(
        self,
        inputs: list,
        outputs: list,
        message_values: str = "❌ Ta fonction ne renvoie pas les bonnes valeurs",
        message_execution: str = "❌ Ta fonction ne s'execute pas, voici le message d'erreur:",
        message_succes: str = "✅ Félicitation ! Ton code fonctionne",
    ):
        """Cette classe teste une fonction f sur un liste d'inputs/outputs, renvoie des messages
        en cas d'erreur et déclenche l'apparition des prochaines cellules sinon."""
        self.inputs = inputs
        self.outputs = outputs
        super().__init__(self.test_function, message_values, message_execution, message_succes)

    def test_function(self, f: Callable):
        for input, output in zip(self.inputs, self.outputs):
            result = f(input)
            if result != output:
                    return False
        return True

class Validation_values(Validation):
    def __init__(
        self,
        target_value: any,
        message_values: str = "❌ Ton code ne fonctionne pas",
        message_execution: str = "❌ Le code ne s'execute pas, voici le message d'erreur:",
        message_succes: str = "✅ Félicitation ! Ton code fonctionne",
    ):
        """Cette classe teste si un objet a la bonne valeur, renvoie des messages
        en cas d'erreur et déclenche l'apparition des prochaines cellules sinon."""
        self.target_value = target_value
        super().__init__(self.test_function, message_values, message_execution, message_succes)

    def test_function(self, value: Callable):
        return value==self.target_value


class Validation_lambda(Validation):
    def __init__(
        self,
        lambda_function: Callable,
        message_values: str = "❌ Ton code ne fonctionne pas",
        message_execution: str = "❌ Le code ne s'execute pas, voici le message d'erreur:",
        message_succes: str = "✅ Félicitation ! Ton code fonctionne",
    ):
        """Cette classe teste si un objet a la bonne valeur, renvoie des messages
        en cas d'erreur et déclenche l'apparition des prochaines cellules sinon."""
        self.lambda_function = lambda_function
        super().__init__(self.test_function, message_values, message_execution, message_succes)

    def test_function(self, value: any):
        return self.lambda_function(value)
    