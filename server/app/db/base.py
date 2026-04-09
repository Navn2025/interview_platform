"""Import all models here so Base.metadata has them before create_all()."""

from app.db.session import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.interview import Interview  # noqa: F401
from app.models.question import Question  # noqa: F401
from app.models.answer import Answer  # noqa: F401
