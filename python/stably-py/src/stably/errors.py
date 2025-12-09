# src/stably/errors.py
from __future__ import annotations


class StablyError(Exception):
    """
    Base exception for all Stably-related errors.

    Stably core itself strives to be usable either via explicit ValidationResult
    objects or via exceptions, depending on consumer preference.
    """

    pass


class ValidationError(StablyError):
    """
    Raised when a pipeline or action fails structural validation.
    """

    def __init__(self, errors: list[str]):
        self.errors = errors
        message = "\n".join(errors) if errors else "Validation failed."
        super().__init__(message)
