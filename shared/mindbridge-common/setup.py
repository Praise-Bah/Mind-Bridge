from setuptools import setup, find_packages

setup(
    name='mindbridge-common',
    version='1.0.0',
    packages=find_packages(),
    install_requires=[
        'Django>=5.0',
        'djangorestframework>=3.15',
        'redis>=5.0',
    ],
    python_requires='>=3.12',
)
